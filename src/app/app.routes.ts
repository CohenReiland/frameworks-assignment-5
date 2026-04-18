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
    component: SignupComponent,
    title: 'Sign Up',
  },
  {
    path: '',
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: '',
    component: DashboardComponent,
    title: 'Dashboard',
  },
  {
    path: '',
    component: TransactionsComponent,
    title: 'Transactions',
  },
  {
    path: '',
    component: CategoriesComponent,
    title: 'Categories',
  },
  {
    path: '',
    component: BudgetComponent,
    title: 'Budget',
  },
];
