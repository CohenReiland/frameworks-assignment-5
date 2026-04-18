import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryType } from '../models/category';
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

  protected readonly categories = this.categoryService.categories;
  protected readonly isLoading = this.categoryService.isLoading;

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

    try {
      await this.categoryService.addCategory(this.categoryForm.getRawValue());
      this.categoryForm.reset({
        name: '',
        description: '',
        icon: 'N',
        color: 'color-blue',
        type: 'expense',
        isPredefined: false,
      });
      this.submitted = false;
    } catch (error: unknown) {
      this.categoryError =
        error instanceof Error ? error.message : 'Unable to save category. Please try again.';
    }
  }
}
