import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      nombre: ['', Validators.required],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('[0-9]{9}')]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmarPassword: ['', Validators.required],
      direccion: ['', Validators.required],
      ciudad: ['', Validators.required],
      provincia: ['', Validators.required],
      codigoPostal: ['', [Validators.required, Validators.pattern('[0-9]{5}')]],
      pais: ['es', Validators.required],
      terminos: [false, Validators.requiredTrue]
    });
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const userData = {
      name: this.registerForm.value.nombre,
      username: this.registerForm.value.username,
      firstName: this.registerForm.value.primerApellido,
      lastName: this.registerForm.value.segundoApellido,
      email: this.registerForm.value.email,
      phone: this.registerForm.value.telefono,
      password: this.registerForm.value.password,
      address: this.registerForm.value.direccion,
      city: this.registerForm.value.ciudad,
      province: this.registerForm.value.provincia,
      postalCode: this.registerForm.value.codigoPostal,
      country: this.registerForm.value.pais
    };

    this.http.post<boolean>('http://localhost:8080/api/users/register', userData)
      .subscribe({
        next: (success) => {
          if (success) {
            alert('Usuario registrado correctamente');
            this.router.navigate(['/login']);
          } else {
            this.errorMessage = 'Error al registrar el usuario';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Error al conectar con el servidor';
          this.isLoading = false;
          console.error('Error de registro:', error);
        }
      });
  }

  resetForm(): void {
    if (confirm('¿Estás seguro de que quieres limpiar el formulario?')) {
      this.registerForm.reset({
        pais: 'es',
        terminos: false
      });
    }
  }
}
