import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Budget } from '../models/budget';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { AuthService } from '../services/auth-service';
import { BudgetService } from '../services/budget-service';
import { TransactionService } from '../services/transaction-service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [NavbarComponent, DecimalPipe],
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
  private readonly chartPalette = ['#9b72ff', '#ff9b54', '#4e7dff', '#ff6e86', '#38c88f'];

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

  protected readonly categorySpendingData = computed(() => {
    const categoryTotals = new Map<string, number>();

    for (const transaction of this.currentMonthTransactions()) {
      if (transaction.type !== 'expense') {
        continue;
      }

      categoryTotals.set(
        transaction.categoryName,
        (categoryTotals.get(transaction.categoryName) ?? 0) + transaction.amount,
      );
    }

    const totalExpenses = Array.from(categoryTotals.values()).reduce(
      (sum, value) => sum + value,
      0,
    );

    if (totalExpenses <= 0) {
      return [];
    }

    return Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: this.chartPalette[index % this.chartPalette.length],
      }));
  });

  protected readonly pieChartGradient = computed(() => {
    const data = this.categorySpendingData();

    if (data.length === 0) {
      return 'conic-gradient(#2e3445 0 100%)';
    }

    let cursor = 0;
    const segments: string[] = [];

    for (const item of data) {
      const start = cursor;
      const end = cursor + item.percentage;
      segments.push(`${item.color} ${start}% ${end}%`);
      cursor = end;
    }

    if (cursor < 100) {
      segments.push(`#2e3445 ${cursor}% 100%`);
    }

    return `conic-gradient(${segments.join(', ')})`;
  });

  protected readonly incomeExpenseTrend = computed(() => {
    const monthKeys = this.getRecentMonthKeys(4);
    const monthTotals = new Map<string, { income: number; expense: number }>();

    for (const monthKey of monthKeys) {
      monthTotals.set(monthKey, { income: 0, expense: 0 });
    }

    for (const transaction of this.transactions()) {
      const monthKey = transaction.date.slice(0, 7);
      const monthData = monthTotals.get(monthKey);

      if (!monthData) {
        continue;
      }

      if (transaction.type === 'income') {
        monthData.income += transaction.amount;
      } else {
        monthData.expense += transaction.amount;
      }
    }

    const peakValue = Math.max(
      1,
      ...Array.from(monthTotals.values()).flatMap((monthData) => [
        monthData.income,
        monthData.expense,
      ]),
    );

    return monthKeys.map((monthKey) => {
      const totals = monthTotals.get(monthKey) ?? { income: 0, expense: 0 };

      return {
        key: monthKey,
        label: this.getMonthShortLabel(monthKey),
        incomeAmount: totals.income,
        expenseAmount: totals.expense,
        incomeHeight: totals.income > 0 ? (totals.income / peakValue) * 100 : 0,
        expenseHeight: totals.expense > 0 ? (totals.expense / peakValue) * 100 : 0,
      };
    });
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

  private getRecentMonthKeys(monthCount: number): string[] {
    const monthKeys: string[] = [];
    const today = new Date();

    for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
      const dateValue = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      monthKeys.push(`${year}-${month}`);
    }

    return monthKeys;
  }

  private getMonthShortLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
    });
  }
}
