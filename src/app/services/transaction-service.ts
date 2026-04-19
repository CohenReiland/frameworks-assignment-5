import { effect, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Budget } from '../models/budget';
import { Transaction } from '../models/transaction';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  readonly transactions = signal<Transaction[]>([]);
  readonly isLoading = signal(false);

  private readonly authService = inject(AuthService);
  private readonly transactionCollection = collection(db, 'transactions');
  private readonly budgetCollection = collection(db, 'budgets');
  private unsubscribeFromTransactions: (() => void) | null = null;

  constructor() {
    effect(() => {
      this.loadTransactionsForUser(this.authService.currentUser()?.id ?? null);
    });
  }

  private loadTransactionsForUser(userId: string | null): void {
    this.unsubscribeFromTransactions?.();

    if (!userId) {
      this.transactions.set([]);
      return;
    }

    const transactionQuery = query(this.transactionCollection, where('userId', '==', userId));

    this.unsubscribeFromTransactions = onSnapshot(transactionQuery, (snapshot) => {
      const data = snapshot.docs.map((transactionDoc) => {
        const transactionData = transactionDoc.data() as Omit<Transaction, 'id'>;

        return {
          ...transactionData,
          id: transactionDoc.id,
        };
      });

      this.transactions.set(data);
    });
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const currentUserId = this.authService.currentUser()?.id;

    if (!currentUserId) {
      return null;
    }

    const transactionRef = doc(db, 'transactions', id);
    const snapshot = await getDoc(transactionRef);

    if (!snapshot.exists()) {
      return null;
    }

    const transactionData = snapshot.data() as Omit<Transaction, 'id'>;

    if (transactionData.userId !== currentUserId) {
      return null;
    }

    return {
      ...transactionData,
      id: snapshot.id,
    };
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'userId'>): Promise<void> {
    const currentUserId = this.authService.currentUser()?.id;

    if (!currentUserId) {
      throw new Error('You must be logged in to add a transaction.');
    }

    this.isLoading.set(true);

    try {
      await addDoc(this.transactionCollection, {
        ...transaction,
        userId: currentUserId,
      });

      if (transaction.type === 'expense') {
        await this.recalculateBudgetSpentForCategoryMonth(
          currentUserId,
          transaction.categoryId,
          this.getMonthKey(transaction.date),
        );
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
    const existingTransaction = await this.getTransactionById(id);

    if (!existingTransaction) {
      throw new Error('Transaction not found or access denied.');
    }

    this.isLoading.set(true);

    try {
      const transactionRef = doc(db, 'transactions', id);
      await updateDoc(transactionRef, transaction);

      const currentUserId = this.authService.currentUser()?.id;

      if (!currentUserId) {
        return;
      }

      const impactedKeys = new Set<string>();

      if (existingTransaction.type === 'expense') {
        impactedKeys.add(
          this.getBudgetImpactKey(
            existingTransaction.categoryId,
            this.getMonthKey(existingTransaction.date),
          ),
        );
      }

      const updatedTransaction: Transaction = {
        ...existingTransaction,
        ...transaction,
      };

      if (updatedTransaction.type === 'expense') {
        impactedKeys.add(
          this.getBudgetImpactKey(
            updatedTransaction.categoryId,
            this.getMonthKey(updatedTransaction.date),
          ),
        );
      }

      for (const key of impactedKeys) {
        const [categoryId, month] = key.split('|');
        await this.recalculateBudgetSpentForCategoryMonth(currentUserId, categoryId, month);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const existingTransaction = await this.getTransactionById(id);

    if (!existingTransaction) {
      throw new Error('Transaction not found or access denied.');
    }

    this.isLoading.set(true);

    try {
      const transactionRef = doc(db, 'transactions', id);
      await deleteDoc(transactionRef);

      const currentUserId = this.authService.currentUser()?.id;

      if (!currentUserId || existingTransaction.type !== 'expense') {
        return;
      }

      await this.recalculateBudgetSpentForCategoryMonth(
        currentUserId,
        existingTransaction.categoryId,
        this.getMonthKey(existingTransaction.date),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private getMonthKey(dateText: string): string {
    return dateText.slice(0, 7);
  }

  private getBudgetImpactKey(categoryId: string, month: string): string {
    return `${categoryId}|${month}`;
  }

  private async recalculateBudgetSpentForCategoryMonth(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<void> {
    if (!categoryId || !month) {
      return;
    }

    const userTransactionsSnapshot = await getDocs(
      query(this.transactionCollection, where('userId', '==', userId)),
    );

    const totalSpentForMonth = userTransactionsSnapshot.docs
      .map((transactionDoc) => transactionDoc.data() as Omit<Transaction, 'id'>)
      .filter(
        (transaction) =>
          transaction.categoryId === categoryId &&
          transaction.type === 'expense' &&
          transaction.date.startsWith(month),
      )
      .reduce((total, transaction) => total + transaction.amount, 0);

    const userBudgetsSnapshot = await getDocs(
      query(this.budgetCollection, where('userId', '==', userId)),
    );

    const matchingBudgetDocs = userBudgetsSnapshot.docs.filter((budgetDoc) => {
      const budgetData = budgetDoc.data() as Omit<Budget, 'id'>;

      return budgetData.categoryId === categoryId && budgetData.month === month;
    });

    await Promise.all(
      matchingBudgetDocs.map((budgetDoc) =>
        updateDoc(doc(db, 'budgets', budgetDoc.id), {
          spent: totalSpentForMonth,
        }),
      ),
    );
  }
}
