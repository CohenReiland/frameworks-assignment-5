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
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal(false);

  private readonly categoryCollection = collection(db, 'categories');

  constructor() {
    this.loadCategories();
  }

  loadCategories(): void {
    onSnapshot(this.categoryCollection, (snapshot) => {
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
    const categoryRef = doc(db, 'categories', id);
    const snapshot = await getDoc(categoryRef);

    if (!snapshot.exists()) {
      return null;
    }

    const categoryData = snapshot.data() as Omit<Category, 'id'>;

    return {
      ...categoryData,
      id: snapshot.id,
    };
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<void> {
    this.isLoading.set(true);

    try {
      await addDoc(this.categoryCollection, category);
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
