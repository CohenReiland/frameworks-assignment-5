import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryType } from '../models/category';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { TransactionService } from '../services/transaction-service';

@Component({
  selector: 'app-transactions-component',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './transactions-component.html',
  styleUrl: './transactions-component.css',
})
export class TransactionsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);

  protected submitted = false;
  protected transactionError = '';

  protected readonly transactions = this.transactionService.transactions;
  protected readonly isLoading = this.transactionService.isLoading;

  protected readonly transactionForm = this.formBuilder.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    categoryId: ['', [Validators.required]],
    categoryName: ['', [Validators.required, Validators.minLength(2)]],
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    notes: [''],
    type: ['expense' as CategoryType, [Validators.required]],
  });

  protected async submitTransaction(): Promise<void> {
    this.submitted = true;
    this.transactionError = '';

    const rawTransaction = this.transactionForm.getRawValue();
    const categoryId =
      rawTransaction.categoryId.trim() ||
      rawTransaction.categoryName.trim().toLowerCase().replace(/\s+/g, '-');

    this.transactionForm.patchValue({ categoryId });

    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    try {
      await this.transactionService.addTransaction(this.transactionForm.getRawValue());
      this.resetTransactionForm();
      this.submitted = false;
    } catch (error: unknown) {
      this.transactionError =
        error instanceof Error ? error.message : 'Unable to save transaction. Please try again.';
    }
  }

  protected resetTransactionForm(): void {
    this.transactionForm.reset({
      amount: 0,
      categoryId: '',
      categoryName: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
      type: 'expense',
    });
    this.submitted = false;
    this.transactionError = '';
  }
}
