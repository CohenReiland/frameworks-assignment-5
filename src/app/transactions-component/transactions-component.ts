import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryType } from '../models/category';
import { Transaction } from '../models/transaction';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { CategoryService } from '../services/category-service';
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
  private readonly categoryService = inject(CategoryService);

  protected submitted = false;
  protected transactionError = '';
  protected readonly editingTransactionId = signal<string | null>(null);
  protected readonly selectedType = signal<CategoryType>('expense');

  protected readonly transactions = this.transactionService.transactions;
  protected readonly isLoading = this.transactionService.isLoading;
  protected readonly categories = this.categoryService.categories;
  protected readonly isEditing = computed(() => this.editingTransactionId() !== null);

  protected readonly thisMonthIncome = computed(() =>
    this.transactions()
      .filter(
        (transaction) => this.isCurrentMonth(transaction.date) && transaction.type === 'income',
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly thisMonthExpenses = computed(() =>
    this.transactions()
      .filter(
        (transaction) => this.isCurrentMonth(transaction.date) && transaction.type === 'expense',
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly transactionCount = computed(() => this.transactions().length);

  protected readonly selectableCategories = computed(() => {
    const selectedType = this.selectedType();

    return this.categories()
      .filter((category) => category.type === selectedType)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    dateFrom: [''],
    dateTo: [''],
    categoryId: [''],
    searchText: [''],
  });

  protected readonly filteredTransactions = computed(() => {
    const { dateFrom, dateTo, categoryId, searchText } = this.filterForm.getRawValue();
    const normalizedSearch = searchText.trim().toLowerCase();

    return this.transactions().filter((transaction) => {
      if (dateFrom && transaction.date < dateFrom) {
        return false;
      }

      if (dateTo && transaction.date > dateTo) {
        return false;
      }

      if (categoryId && transaction.categoryId !== categoryId) {
        return false;
      }

      if (
        normalizedSearch &&
        !`${transaction.categoryName} ${transaction.notes ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      return true;
    });
  });

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

    this.syncCategoryFromSelection(this.transactionForm.controls.categoryId.value);

    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const editingId = this.editingTransactionId();

    try {
      if (editingId) {
        await this.transactionService.updateTransaction(
          editingId,
          this.transactionForm.getRawValue(),
        );
      } else {
        await this.transactionService.addTransaction(this.transactionForm.getRawValue());
      }

      this.resetTransactionForm();
      this.submitted = false;
    } catch (error: unknown) {
      this.transactionError =
        error instanceof Error ? error.message : 'Unable to save transaction. Please try again.';
    }
  }

  protected onCategoryChange(categoryId: string): void {
    this.syncCategoryFromSelection(categoryId);
  }

  protected onTypeChange(): void {
    this.selectedType.set(this.transactionForm.controls.type.value);

    const selectedCategoryId = this.transactionForm.controls.categoryId.value;
    const isSelectedCategoryStillValid = this.selectableCategories().some(
      (category) => category.id === selectedCategoryId,
    );

    if (!isSelectedCategoryStillValid) {
      this.transactionForm.patchValue({
        categoryId: '',
        categoryName: '',
      });
    }
  }

  protected startEditTransaction(transaction: Transaction): void {
    this.editingTransactionId.set(transaction.id);
    this.selectedType.set(transaction.type);
    this.submitted = false;
    this.transactionError = '';
    this.transactionForm.setValue({
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      categoryName: transaction.categoryName,
      date: transaction.date,
      notes: transaction.notes ?? '',
      type: transaction.type,
    });
  }

  protected cancelEdit(): void {
    this.resetTransactionForm();
    this.submitted = false;
    this.transactionError = '';
  }

  protected async deleteTransaction(transactionId: string): Promise<void> {
    this.transactionError = '';

    try {
      await this.transactionService.deleteTransaction(transactionId);

      if (this.editingTransactionId() === transactionId) {
        this.resetTransactionForm();
      }
    } catch (error: unknown) {
      this.transactionError =
        error instanceof Error ? error.message : 'Unable to delete transaction. Please try again.';
    }
  }

  protected resetFilters(): void {
    this.filterForm.reset({
      dateFrom: '',
      dateTo: '',
      categoryId: '',
      searchText: '',
    });
  }

  protected resetTransactionForm(): void {
    this.editingTransactionId.set(null);
    this.selectedType.set('expense');
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

  private syncCategoryFromSelection(categoryId: string): void {
    const selectedCategory = this.selectableCategories().find(
      (category) => category.id === categoryId,
    );

    if (!selectedCategory) {
      return;
    }

    this.transactionForm.patchValue({
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
    });
  }

  private isCurrentMonth(dateText: string): boolean {
    if (!dateText) {
      return false;
    }

    const dateValue = new Date(dateText);
    const now = new Date();

    return dateValue.getFullYear() === now.getFullYear() && dateValue.getMonth() === now.getMonth();
  }
}
