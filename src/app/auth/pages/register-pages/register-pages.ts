import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'register-pages',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register-pages.html'

})
export class RegisterPages {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  hasError = signal(false);
  isPosting = signal(false);

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.hasError.set(true);
      setTimeout(() => this.hasError.set(false), 2000);
      return;
    }

    this.isPosting.set(true);

    const { username = '', email = '', password = '' } = this.registerForm.value;

    this.authService.register(username!, email!, password!).subscribe(registered => {
      this.isPosting.set(false);

      if (registered) {
        this.router.navigateByUrl('/');
        return;
      }

      this.hasError.set(true);
      setTimeout(() => this.hasError.set(false), 2000);
    });
  }
}
