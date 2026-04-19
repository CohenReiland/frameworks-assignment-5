import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../models/category';
import { Budget } from '../models/budget';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { BudgetService } from '../services/budget-service';
import { CategoryService } from '../services/category-service';

@Component({
  selector: 'app-budget-component',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, DecimalPipe],
  templateUrl: './budget-component.html',
  styleUrl: './budget-component.css',
})
export class BudgetComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);

  protected submitted = false;
  protected budgetError = '';
  protected readonly editingBudgetId = signal<string | null>(null);

  protected readonly budgets = this.budgetService.budgets;
  protected readonly isLoading = this.budgetService.isLoading;
  protected readonly categories = this.categoryService.categories;

  protected readonly totalMonthlyBudget = computed(() =>
    this.budgets().reduce((sum, budget) => sum + budget.limit, 0),
  );

  protected readonly totalSpentSoFar = computed(() =>
    this.budgets().reduce((sum, budget) => sum + budget.spent, 0),
  );

  protected readonly activeAlertCount = computed(
    () =>
      this.budgets().filter((budget) => {
        const thresholdAmount = budget.limit * (budget.alertThreshold / 100);
        return budget.spent >= thresholdAmount;
      }).length,
  );

  protected readonly alertBudgets = computed(() =>
    this.budgets().filter((budget) => {
      const thresholdAmount = budget.limit * (budget.alertThreshold / 100);
      return budget.spent >= thresholdAmount;
    }),
  );

  protected readonly selectableCategories = computed(() =>
    [...this.categories()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly isEditing = computed(() => this.editingBudgetId() !== null);

  protected readonly budgetForm = this.formBuilder.nonNullable.group({
    categoryId: ['', [Validators.required]],
    categoryName: ['', [Validators.required, Validators.minLength(2)]],
    month: [new Date().toISOString().slice(0, 7), [Validators.required]],
    limit: [0, [Validators.required, Validators.min(0)]],
    spent: [0, [Validators.required, Validators.min(0)]],
    alertThreshold: [85, [Validators.required, Validators.min(1), Validators.max(100)]],
  });

  protected async submitBudget(): Promise<void> {
    this.submitted = true;
    this.budgetError = '';

    this.syncCategoryFromSelection(this.budgetForm.controls.categoryId.value);

    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    const editingId = this.editingBudgetId();

    try {
      if (editingId) {
        await this.budgetService.updateBudget(editingId, this.budgetForm.getRawValue());
      } else {
        await this.budgetService.addBudget(this.budgetForm.getRawValue());
      }

      this.resetForm();
      this.submitted = false;
    } catch (error: unknown) {
      this.budgetError =
        error instanceof Error ? error.message : 'Unable to save budget. Please try again.';
    }
  }

  protected onCategoryChange(categoryId: string): void {
    this.syncCategoryFromSelection(categoryId);
  }

  protected startEditBudget(budget: Budget): void {
    this.editingBudgetId.set(budget.id);
    this.submitted = false;
    this.budgetError = '';
    this.budgetForm.setValue({
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      month: budget.month,
      limit: budget.limit,
      spent: budget.spent,
      alertThreshold: budget.alertThreshold,
    });
  }

  protected cancelEdit(): void {
    this.resetForm();
    this.submitted = false;
    this.budgetError = '';
  }

  protected async deleteBudget(budgetId: string): Promise<void> {
    this.budgetError = '';

    try {
      await this.budgetService.deleteBudget(budgetId);

      if (this.editingBudgetId() === budgetId) {
        this.resetForm();
      }
    } catch (error: unknown) {
      this.budgetError =
        error instanceof Error ? error.message : 'Unable to delete budget. Please try again.';
    }
  }

  private syncCategoryFromSelection(categoryId: string): void {
    const selectedCategory = this.selectableCategories().find(
      (category) => category.id === categoryId,
    );

    if (!selectedCategory) {
      return;
    }

    this.budgetForm.patchValue({
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
    });
  }

  private resetForm(): void {
    this.editingBudgetId.set(null);
    this.budgetForm.reset({
      categoryId: '',
      categoryName: '',
      month: new Date().toISOString().slice(0, 7),
      limit: 0,
      spent: 0,
      alertThreshold: 85,
    });
  }
}
