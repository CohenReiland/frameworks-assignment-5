import { Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Transaction } from '../models/transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  readonly transactions = signal<Transaction[]>([]);
  readonly isLoading = signal(false);

  private readonly transactionCollection = collection(db, 'transactions');

  constructor() {
    this.loadTransactions();
  }

  loadTransactions(): void {
    onSnapshot(this.transactionCollection, (snapshot) => {
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
    const transactionRef = doc(db, 'transactions', id);
    const snapshot = await getDoc(transactionRef);

    if (!snapshot.exists()) {
      return null;
    }

    const transactionData = snapshot.data() as Omit<Transaction, 'id'>;

    return {
      ...transactionData,
      id: snapshot.id,
    };
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    this.isLoading.set(true);

    try {
      await addDoc(this.transactionCollection, transaction);
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
