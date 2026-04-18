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
import { Budget } from '../models/budget';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  readonly budgets = signal<Budget[]>([]);
  readonly isLoading = signal(false);

  private readonly budgetCollection = collection(db, 'budgets');

  constructor() {
    this.loadBudgets();
  }

  loadBudgets(): void {
    onSnapshot(this.budgetCollection, (snapshot) => {
      const data = snapshot.docs.map((budgetDoc) => {
        const budgetData = budgetDoc.data() as Omit<Budget, 'id'>;

        return {
          ...budgetData,
          id: budgetDoc.id,
        };
      });

      this.budgets.set(data);
    });
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    const budgetRef = doc(db, 'budgets', id);
    const snapshot = await getDoc(budgetRef);

    if (!snapshot.exists()) {
      return null;
    }

    const budgetData = snapshot.data() as Omit<Budget, 'id'>;

    return {
      ...budgetData,
      id: snapshot.id,
    };
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<void> {
    this.isLoading.set(true);

    try {
      await addDoc(this.budgetCollection, budget);
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    this.isLoading.set(true);

    try {
      const budgetRef = doc(db, 'budgets', id);
      await updateDoc(budgetRef, budget);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteBudget(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const budgetRef = doc(db, 'budgets', id);
      await deleteDoc(budgetRef);
    } finally {
      this.isLoading.set(false);
    }
  }
}
