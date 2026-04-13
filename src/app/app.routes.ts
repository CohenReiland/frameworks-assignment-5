import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard-component/dashboard-component';
import { TransactionsComponent } from './transactions-component/transactions-component';
import { CategoriesComponent } from './categories-component/categories-component';
import { AuthComponent } from './auth-component/auth-component';
import { BudgetComponent } from './budget-component/budget-component';

export const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    title: 'Auth',
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
