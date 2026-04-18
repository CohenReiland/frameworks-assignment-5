import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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

  protected readonly isLoading = computed(
    () => this.budgetService.isLoading() || this.transactionService.isLoading(),
  );

  protected readonly monthlyIncome = computed(() =>
    this.transactions()
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly monthlyExpenses = computed(() =>
    this.transactions()
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly plannedBudget = computed(() =>
    this.budgets().reduce((sum, budget) => sum + budget.limit, 0),
  );

  protected readonly budgetLeft = computed(() => this.plannedBudget() - this.monthlyExpenses());

  protected readonly transactionCount = computed(() => this.transactions().length);

  protected readonly overBudgetCount = computed(
    () => this.budgets().filter((budget) => budget.spent > budget.limit).length,
  );

  protected readonly topCategory = computed(() => {
    const budgets = this.budgets();

    if (budgets.length === 0) {
      return null;
    }

    return budgets.reduce((top, budget) => (budget.spent > top.spent ? budget : top), budgets[0]);
  });

  protected readonly bestControlledCategory = computed(() => {
    const budgets = this.budgets().filter((budget) => budget.limit > 0);

    if (budgets.length === 0) {
      return null;
    }

    return budgets.reduce((best, budget) => {
      const bestUsage = best.spent / best.limit;
      const currentUsage = budget.spent / budget.limit;

      return currentUsage < bestUsage ? budget : best;
    }, budgets[0]);
  });
}
