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
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly users = signal<User[]>([]);
  readonly isLoading = signal(false);

  private readonly userCollection = collection(db, 'users');

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    onSnapshot(this.userCollection, (snapshot) => {
      const data = snapshot.docs.map((userDoc) => {
        const userData = userDoc.data() as Omit<User, 'id'>;

        return {
          ...userData,
          id: userDoc.id,
        };
      });

      this.users.set(data);
    });
  }

  async getUserById(id: string): Promise<User | null> {
    const userRef = doc(db, 'users', id);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const userData = snapshot.data() as Omit<User, 'id'>;

    return {
      ...userData,
      id: snapshot.id,
    };
  }

  async addUser(user: Omit<User, 'id'>): Promise<void> {
    this.isLoading.set(true);

    try {
      await addDoc(this.userCollection, user);
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateUser(id: string, user: Partial<User>): Promise<void> {
    this.isLoading.set(true);

    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, user);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const userRef = doc(db, 'users', id);
      await deleteDoc(userRef);
    } finally {
      this.isLoading.set(false);
    }
  }
}
