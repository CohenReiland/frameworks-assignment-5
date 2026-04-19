import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryType } from '../models/category';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { CategoryService } from '../services/category-service';

@Component({
  selector: 'app-categories-component',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './categories-component.html',
  styleUrl: './categories-component.css',
})
export class CategoriesComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  protected submitted = false;
  protected categoryError = '';
  protected readonly editingCategoryId = signal<string | null>(null);

  protected readonly categories = this.categoryService.categories;
  protected readonly isLoading = this.categoryService.isLoading;
  protected readonly predefinedCategories = computed(() =>
    this.categories().filter((category) => category.isPredefined),
  );
  protected readonly customCategories = computed(() =>
    this.categories().filter((category) => !category.isPredefined),
  );
  protected readonly isEditing = computed(() => this.editingCategoryId() !== null);

  protected readonly colorOptions: ReadonlyArray<{ value: Category['color']; label: string }> = [
    { value: 'color-blue', label: 'Blue' },
    { value: 'color-green', label: 'Green' },
    { value: 'color-red', label: 'Red' },
    { value: 'color-orange', label: 'Orange' },
    { value: 'color-purple', label: 'Purple' },
    { value: 'color-cyan', label: 'Cyan' },
    { value: 'color-gold', label: 'Gold' },
    { value: 'color-pink', label: 'Pink' },
  ];

  protected readonly categoryForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    icon: ['N', [Validators.required]],
    color: ['color-blue', [Validators.required]],
    type: ['expense' as CategoryType, [Validators.required]],
    isPredefined: [false],
  });

  protected async submitCategory(): Promise<void> {
    this.submitted = true;
    this.categoryError = '';

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const editingId = this.editingCategoryId();

    try {
      if (editingId) {
        await this.categoryService.updateCategory(editingId, this.categoryForm.getRawValue());
      } else {
        await this.categoryService.addCategory(this.categoryForm.getRawValue());
      }

      this.resetForm();
      this.submitted = false;
    } catch (error: unknown) {
      this.categoryError =
        error instanceof Error ? error.message : 'Unable to save category. Please try again.';
    }
  }

  protected startEditCategory(category: Category): void {
    this.editingCategoryId.set(category.id);
    this.categoryError = '';
    this.submitted = false;
    this.categoryForm.setValue({
      name: category.name,
      description: category.description ?? '',
      icon: category.icon,
      color: category.color,
      type: category.type,
      isPredefined: category.isPredefined,
    });
  }

  protected cancelEdit(): void {
    this.resetForm();
    this.submitted = false;
    this.categoryError = '';
  }

  protected async deleteCategory(categoryId: string): Promise<void> {
    this.categoryError = '';

    try {
      await this.categoryService.deleteCategory(categoryId);
      if (this.editingCategoryId() === categoryId) {
        this.resetForm();
      }
    } catch (error: unknown) {
      this.categoryError =
        error instanceof Error ? error.message : 'Unable to delete category. Please try again.';
    }
  }

  private resetForm(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({
      name: '',
      description: '',
      icon: 'N',
      color: 'color-blue',
      type: 'expense',
      isPredefined: false,
    });
  }
}
