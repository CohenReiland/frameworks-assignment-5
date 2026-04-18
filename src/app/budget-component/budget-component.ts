import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { BudgetService } from '../services/budget-service';

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

  protected submitted = false;
  protected budgetError = '';

  protected readonly budgets = this.budgetService.budgets;
  protected readonly isLoading = this.budgetService.isLoading;

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

    const rawBudget = this.budgetForm.getRawValue();
    const categoryId =
      rawBudget.categoryId.trim() ||
      rawBudget.categoryName.trim().toLowerCase().replace(/\s+/g, '-');

    this.budgetForm.patchValue({ categoryId });

    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    try {
      await this.budgetService.addBudget(this.budgetForm.getRawValue());
      this.budgetForm.reset({
        categoryId: '',
        categoryName: '',
        month: new Date().toISOString().slice(0, 7),
        limit: 0,
        spent: 0,
        alertThreshold: 85,
      });
      this.submitted = false;
    } catch (error: unknown) {
      this.budgetError =
        error instanceof Error ? error.message : 'Unable to save budget. Please try again.';
    }
  }
}
