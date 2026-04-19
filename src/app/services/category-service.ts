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
import { Category } from '../models/category';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal(false);

  private readonly authService = inject(AuthService);
  private readonly categoryCollection = collection(db, 'categories');
  private unsubscribeFromCategories: (() => void) | null = null;

  constructor() {
    effect(() => {
      this.loadCategoriesForUser(this.authService.currentUser()?.id ?? null);
    });
  }

  private loadCategoriesForUser(userId: string | null): void {
    this.unsubscribeFromCategories?.();

    if (!userId) {
      this.categories.set([]);
      return;
    }

    const categoryQuery = query(this.categoryCollection, where('userId', '==', userId));

    this.unsubscribeFromCategories = onSnapshot(categoryQuery, (snapshot) => {
      const data = snapshot.docs.map((categoryDoc) => {
        const categoryData = categoryDoc.data() as Omit<Category, 'id'>;

        return {
          ...categoryData,
          id: categoryDoc.id,
        };
      });

      this.categories.set(data);
    });
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const currentUserId = this.authService.currentUser()?.id;

    if (!currentUserId) {
      return null;
    }

    const categoryRef = doc(db, 'categories', id);
    const snapshot = await getDoc(categoryRef);

    if (!snapshot.exists()) {
      return null;
    }

    const categoryData = snapshot.data() as Omit<Category, 'id'>;

    if (categoryData.userId !== currentUserId) {
      return null;
    }

    return {
      ...categoryData,
      id: snapshot.id,
    };
  }

  async addCategory(category: Omit<Category, 'id' | 'userId'>): Promise<void> {
    const currentUserId = this.authService.currentUser()?.id;

    if (!currentUserId) {
      throw new Error('You must be logged in to add a category.');
    }

    this.isLoading.set(true);

    try {
      await addDoc(this.categoryCollection, {
        ...category,
        userId: currentUserId,
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    this.isLoading.set(true);

    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, category);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
    } finally {
      this.isLoading.set(false);
    }
  }
}
