import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-signup-component',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup-component.html',
  styleUrl: './signup-component.css',
})
export class SignupComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected showPassword = false;
  protected submitted = false;
  protected signupError = '';
  protected readonly isLoading = this.authService.isLoading;

  protected readonly signupForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  protected async submit(): Promise<void> {
    this.submitted = true;
    this.signupError = '';

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { fullName, email, password } = this.signupForm.getRawValue();

    try {
      await this.authService.signUp({ fullName, email, password });
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.signupError =
        error instanceof Error ? error.message : 'Unable to create account. Please try again.';
    }
  }
}
