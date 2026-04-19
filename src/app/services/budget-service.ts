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
import { Budget } from '../models/budget';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  readonly budgets = signal<Budget[]>([]);
  readonly isLoading = signal(false);

  private readonly authService = inject(AuthService);
  private readonly budgetCollection = collection(db, 'budgets');
  private unsubscribeFromBudgets: (() => void) | null = null;

  constructor() {
    effect(() => {
      this.loadBudgetsForUser(this.authService.currentUser()?.id ?? null);
    });
  }

  private loadBudgetsForUser(userId: string | null): void {
    this.unsubscribeFromBudgets?.();

    if (!userId) {
      this.budgets.set([]);
      return;
    }

    const budgetQuery = query(this.budgetCollection, where('userId', '==', userId));

    this.unsubscribeFromBudgets = onSnapshot(budgetQuery, (snapshot) => {
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
    const currentUserId = this.authService.currentUser()?.id;

    if (!currentUserId) {
      return null;
    }

    const budgetRef = doc(db, 'budgets', id);
    const snapshot = await getDoc(budgetRef);

    if (!snapshot.exists()) {
      return null;
    }

    const budgetData = snapshot.data() as Omit<Budget, 'id'>;

    if (budgetData.userId !== currentUserId) {
      return null;
    }

    return {
      ...budgetData,
      id: snapshot.id,
    };
  }

  async addBudget(budget: Omit<Budget, 'id' | 'userId'>): Promise<void> {
    const currentUserId = this.authService.currentUser()?.id;

    if (!currentUserId) {
      throw new Error('You must be logged in to add a budget.');
    }

    this.isLoading.set(true);

    try {
      await addDoc(this.budgetCollection, {
        ...budget,
        userId: currentUserId,
      });
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
