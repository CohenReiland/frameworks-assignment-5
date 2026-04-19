import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { DashboardComponent } from './dashboard-component/dashboard-component';
import { TransactionsComponent } from './transactions-component/transactions-component';
import { CategoriesComponent } from './categories-component/categories-component';
import { BudgetComponent } from './budget-component/budget-component';
import { SignupComponent } from './signup-component/signup-component';
import { LoginComponent } from './login-component/login-component';
import { auth } from './firebase.config';
import { SettingsComponent } from './settings-component/settings-component';

const resolveAuthUser = async (): Promise<boolean> =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(Boolean(user));
    });
  });

const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const isAuthenticated = await resolveAuthUser();

  return isAuthenticated ? true : router.createUrlTree(['/login']);
};

const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const isAuthenticated = await resolveAuthUser();

  return isAuthenticated ? router.createUrlTree(['/dashboard']) : true;
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'signup',
    component: SignupComponent,
    title: 'Sign Up',
    canActivate: [guestGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'transactions',
    component: TransactionsComponent,
    title: 'Transactions',
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    component: CategoriesComponent,
    title: 'Categories',
    canActivate: [authGuard],
  },
  {
    path: 'budget',
    component: BudgetComponent,
    title: 'Budget',
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'Settings',
    canActivate: [authGuard],
  },
];
