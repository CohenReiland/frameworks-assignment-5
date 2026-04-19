import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase.config';
import { NavbarComponent } from '../navbar-component/navbar-component';
import { AuthService } from '../services/auth-service';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-settings-component',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './settings-component.html',
  styleUrl: './settings-component.css',
})
export class SettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  protected profileSubmitted = false;
  protected passwordSubmitted = false;
  protected profileError = '';
  protected passwordError = '';
  protected profileSuccess = '';
  protected passwordSuccess = '';

  protected readonly currentUser = this.authService.currentUser;

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    effect(() => {
      const user = this.currentUser();

      if (!user) {
        return;
      }

      this.profileForm.patchValue(
        {
          fullName: user.fullName,
          email: user.email,
        },
        { emitEvent: false },
      );
    });
  }

  protected async saveProfile(): Promise<void> {
    this.profileSubmitted = true;
    this.profileError = '';
    this.profileSuccess = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();
    const firebaseUser = auth.currentUser;

    if (!user || !firebaseUser) {
      this.profileError = 'You must be logged in to update profile details.';
      return;
    }

    const { fullName, email } = this.profileForm.getRawValue();

    try {
      await updateProfile(firebaseUser, { displayName: fullName });

      if (email !== firebaseUser.email) {
        await updateEmail(firebaseUser, email);
      }

      await this.userService.updateUser(user.id, {
        fullName,
        email,
      });

      this.authService.currentUser.set({
        ...user,
        fullName,
        email,
      });

      this.profileSuccess = 'Profile updated successfully.';
    } catch (error: unknown) {
      this.profileError = this.getAuthErrorMessage(error, 'Unable to update profile.');
    }
  }

  protected async savePassword(): Promise<void> {
    this.passwordSubmitted = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }

    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      this.passwordError = 'You must be logged in to update your password.';
      return;
    }

    try {
      await updatePassword(firebaseUser, newPassword);
      this.passwordForm.reset({
        newPassword: '',
        confirmPassword: '',
      });
      this.passwordSubmitted = false;
      this.passwordSuccess = 'Password updated successfully.';
    } catch (error: unknown) {
      this.passwordError = this.getAuthErrorMessage(error, 'Unable to update password.');
    }
  }

  private getAuthErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof Error)) {
      return fallback;
    }

    if (error.message.includes('auth/requires-recent-login')) {
      return 'For security, please log out and back in before changing this value.';
    }

    if (error.message.includes('auth/email-already-in-use')) {
      return 'That email is already in use by another account.';
    }

    return fallback;
  }
}
