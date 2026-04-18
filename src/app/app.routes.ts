import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard-component/dashboard-component';
import { TransactionsComponent } from './transactions-component/transactions-component';
import { CategoriesComponent } from './categories-component/categories-component';
import { BudgetComponent } from './budget-component/budget-component';
import { SignupComponent } from './signup-component/signup-component';
import { LoginComponent } from './login-component/login-component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signup',
    pathMatch: 'full',
  },
  {
    path: 'signup',
    component: SignupComponent,
    title: 'Sign Up',
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Dashboard',
  },
  {
    path: 'transactions',
    component: TransactionsComponent,
    title: 'Transactions',
  },
  {
    path: 'categories',
    component: CategoriesComponent,
    title: 'Categories',
  },
  {
    path: 'budget',
    component: BudgetComponent,
    title: 'Budget',
  },
];
