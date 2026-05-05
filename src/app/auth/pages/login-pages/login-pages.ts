import { Component, inject, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { FormBuilder,ReactiveFormsModule,Validators } from "@angular/forms";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-pages',
  imports: [RouterLink,ReactiveFormsModule],
  templateUrl: './login-pages.html',
})
export class LoginPages {
  fb =inject(FormBuilder)
  hasError = signal(false)
  isPosting = signal(false)

  loginForm = this.fb.group({
    email: ['', [Validators.required,Validators.email]],
    password: ['', [Validators.required,Validators.minLength(6)]],
  })

  AuthService = inject(AuthService)

  onSubmit(){
    if(this.loginForm.invalid) {
      this.hasError.set(true)
        setTimeout(() => {
          this.hasError.set(false);
        }, 2000);
      return
    }

    const{ email = '', password= '' } = this.loginForm.value;
    console.log({ email, password })

    this.AuthService.login(email!,password!).subscribe(resp=>{
      console.log(resp)
    })
  }


}
