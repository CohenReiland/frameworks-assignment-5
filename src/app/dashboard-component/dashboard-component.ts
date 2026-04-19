import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Budget } from '../models/budget';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { AuthService } from '../services/auth-service';
import { BudgetService } from '../services/budget-service';
import { TransactionService } from '../services/transaction-service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly budgetService = inject(BudgetService);
  private readonly transactionService = inject(TransactionService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly budgets = this.budgetService.budgets;
  protected readonly transactions = this.transactionService.transactions;

  private readonly currentMonthKey = new Date().toISOString().slice(0, 7);

  protected readonly isLoading = computed(
    () => this.budgetService.isLoading() || this.transactionService.isLoading(),
  );

  protected readonly currentMonthTransactions = computed(() =>
    this.transactions().filter((transaction) => transaction.date.startsWith(this.currentMonthKey)),
  );

  protected readonly currentMonthBudgets = computed(() =>
    this.budgets().filter((budget) => budget.month === this.currentMonthKey),
  );

  protected readonly currentMonthLabel = computed(() => {
    const [year, month] = this.currentMonthKey.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });

  protected readonly spentByCategoryMonth = computed(() => {
    const totals = new Map<string, number>();

    for (const transaction of this.transactions()) {
      if (transaction.type !== 'expense') {
        continue;
      }

      const key = this.getBudgetKey(transaction.categoryId, transaction.date.slice(0, 7));
      totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
    }

    return totals;
  });

  protected readonly monthlyIncome = computed(() =>
    this.currentMonthTransactions()
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly monthlyExpenses = computed(() =>
    this.currentMonthTransactions()
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly plannedBudget = computed(() =>
    this.currentMonthBudgets().reduce((sum, budget) => sum + budget.limit, 0),
  );

  protected readonly transactionCount = computed(() => this.transactions().length);

  protected readonly overBudgetCount = computed(
    () =>
      this.currentMonthBudgets().filter((budget) => this.getBudgetSpent(budget) > budget.limit)
        .length,
  );

  protected readonly topCategory = computed(() => {
    const budgets = this.currentMonthBudgets();

    if (budgets.length === 0) {
      return null;
    }

    return budgets.reduce((top, budget) =>
      this.getBudgetSpent(budget) > this.getBudgetSpent(top) ? budget : top,
    );
  });

  protected readonly bestControlledCategory = computed(() => {
    const budgets = this.currentMonthBudgets().filter((budget) => budget.limit > 0);

    if (budgets.length === 0) {
      return null;
    }

    return budgets.reduce((best, budget) => {
      const bestUsage = this.getBudgetUsagePercent(best);
      const currentUsage = this.getBudgetUsagePercent(budget);

      return currentUsage < bestUsage ? budget : best;
    });
  });

  protected getBudgetSpent(budget: Budget): number {
    const key = this.getBudgetKey(budget.categoryId, budget.month);
    return this.spentByCategoryMonth().get(key) ?? 0;
  }

  protected getBudgetUsagePercent(budget: Budget): number {
    if (budget.limit <= 0) {
      return 0;
    }

    return (this.getBudgetSpent(budget) / budget.limit) * 100;
  }

  protected getBudgetKey(categoryId: string, month: string): string {
    return `${categoryId}|${month}`;
  }
}
