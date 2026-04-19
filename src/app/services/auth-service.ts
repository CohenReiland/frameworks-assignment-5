import { Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { Category } from '../models/category';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly users = signal<User[]>([]);
  readonly currentUser = signal<User | null>(null);
  readonly firebaseUser = signal<FirebaseUser | null>(null);
  readonly isLoading = signal(false);

  private readonly userCollection = collection(db, 'users');
  private readonly categoryCollection = collection(db, 'categories');

  constructor() {
    this.loadUsers();
    this.listenToAuthState();
  }

  private listenToAuthState(): void {
    onAuthStateChanged(auth, async (firebaseUser) => {
      this.firebaseUser.set(firebaseUser);

      if (!firebaseUser) {
        this.currentUser.set(null);
        return;
      }

      const userProfile = await this.getUserByAuthId(firebaseUser.uid);
      this.currentUser.set(userProfile);
    });
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

  async signUp(user: Pick<User, 'fullName' | 'email' | 'password'>): Promise<void> {
    this.isLoading.set(true);

    try {
      const credentials = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password ?? '',
      );

      await updateProfile(credentials.user, {
        displayName: user.fullName,
      });

      const newUser: User = {
        id: credentials.user.uid,
        authId: credentials.user.uid,
        fullName: user.fullName,
        email: user.email,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', credentials.user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
      });

      await this.seedStarterCategories(credentials.user.uid);

      this.currentUser.set(newUser);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async seedStarterCategories(userId: string): Promise<void> {
    const starterCategories: Omit<Category, 'id' | 'userId'>[] = [
      {
        name: 'Salary',
        description: 'Monthly paycheck and recurring income sources.',
        icon: 'S',
        color: 'color-green',
        type: 'income',
        isPredefined: true,
      },
      {
        name: 'Freelance',
        description: 'Side projects, consulting, and contract work.',
        icon: 'F',
        color: 'color-cyan',
        type: 'income',
        isPredefined: true,
      },
      {
        name: 'Food',
        description: 'Groceries, dining out, and coffee.',
        icon: 'F',
        color: 'color-orange',
        type: 'expense',
        isPredefined: true,
      },
      {
        name: 'Housing',
        description: 'Rent, mortgage, and home utilities.',
        icon: 'H',
        color: 'color-purple',
        type: 'expense',
        isPredefined: true,
      },
      {
        name: 'Transportation',
        description: 'Fuel, transit, parking, and rideshare.',
        icon: 'T',
        color: 'color-blue',
        type: 'expense',
        isPredefined: true,
      },
      {
        name: 'Health',
        description: 'Medical visits, medication, and wellness costs.',
        icon: 'M',
        color: 'color-red',
        type: 'expense',
        isPredefined: true,
      },
    ];

    const batch = writeBatch(db);

    for (const category of starterCategories) {
      const categoryRef = doc(this.categoryCollection);
      batch.set(categoryRef, {
        ...category,
        userId,
      });
    }

    await batch.commit();
  }

  async login(email: string, password: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await this.getUserByAuthId(credentials.user.uid);
      this.currentUser.set(userProfile);
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.currentUser.set(null);
  }

  async addUser(user: Omit<User, 'id'>): Promise<void> {
    await addDoc(this.userCollection, user);
  }

  async updateUser(id: string, user: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, user);
  }

  async deleteUser(id: string): Promise<void> {
    const userRef = doc(db, 'users', id);
    await deleteDoc(userRef);

    if (this.currentUser()?.id === id) {
      this.currentUser.set(null);
    }
  }

  private async getUserByAuthId(authId: string): Promise<User | null> {
    const userRef = doc(db, 'users', authId);
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
}
