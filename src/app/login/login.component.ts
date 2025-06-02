import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.http.post<any>('http://localhost:8080/api/users/login', credentials)
      .subscribe({
        next: (isValid) => {
        if (isValid) {
          this.router.navigate(['/layout']);
        } else {
          this.errorMessage = 'Credenciales incorrectas';
        }
        this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Error al conectar con el servidor';
          this.isLoading = false;
          console.error('Error de autenticación:', error);
        }
      });
  }
}
