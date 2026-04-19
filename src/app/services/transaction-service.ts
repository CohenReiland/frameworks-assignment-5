import { effect, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase.config';
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
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
    this.isLoading.set(true);

    try {
      const transactionRef = doc(db, 'transactions', id);
      await updateDoc(transactionRef, transaction);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const transactionRef = doc(db, 'transactions', id);
      await deleteDoc(transactionRef);
    } finally {
      this.isLoading.set(false);
    }
  }
}
