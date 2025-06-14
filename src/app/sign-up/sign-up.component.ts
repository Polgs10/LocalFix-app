import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Observable, of, switchMap, tap } from 'rxjs';

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
  selectedFile: File | null = null;
  imagePreview: string = 'https://via.placeholder.com/120x120?text=Logo';

  usernameExists = false;
  emailExists = false;
  checkingUsername = false;
  checkingEmail = false;

  private apiUrl = 'http://localhost:8080/api/users';

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
      pais: ['España', Validators.required],
      terminos: [false, Validators.requiredTrue]
    });

    this.registerForm.get('username')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.checkingUsername = true),
      switchMap(username => this.checkUsernameAvailability(username))
    ).subscribe({
      next: (exists) => {
        this.usernameExists = exists;
        this.checkingUsername = false;
        if (exists) {
          this.registerForm.get('username')?.setErrors({ notUnique: true });
        }
      },
      error: () => this.checkingUsername = false
    });

    // Validación en tiempo real para email
    this.registerForm.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.checkingEmail = true),
      switchMap(email => this.checkEmailAvailability(email))
    ).subscribe({
      next: (exists) => {
        this.emailExists = exists;
        this.checkingEmail = false;
        if (exists) {
          this.registerForm.get('email')?.setErrors({ notUnique: true });
        }
      },
      error: () => this.checkingEmail = false
    });
  }

  private checkUsernameAvailability(username: string): Observable<boolean> {
    if (!username) return of(false);
    return this.http.get<boolean>(`${this.apiUrl}/check-username/${username}`);
  }

  private checkEmailAvailability(email: string): Observable<boolean> {
    if (!email) return of(false);
    return this.http.get<boolean>(`${this.apiUrl}/check-email/${email}`);
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

    if (this.selectedFile) {
      this.registerWithImage(userData, this.selectedFile).subscribe({
        next: (success) => this.handleRegistrationResponse(success),
        error: (error) => this.handleRegistrationError(error)
      });
    } else {
      this.http.post<boolean>(`${this.apiUrl}/register`, userData).subscribe({
        next: (success) => this.handleRegistrationResponse(success),
        error: (error) => this.handleRegistrationError(error)
      });
    }
  }

  private registerWithImage(userData: any, imageFile: File): Observable<boolean> {
    const formData = new FormData();

      const userDataBlob = new Blob([JSON.stringify(userData)], { type: 'application/json' });
      formData.append('userData', userDataBlob);
      formData.append('profileImage', imageFile);

      return this.http.post<boolean>(`${this.apiUrl}/register-with-image`, formData);
  }

  private handleRegistrationResponse(success: boolean): void {
    this.isLoading = false;
    if (success) {
      alert('Usuario registrado correctamente');
      this.router.navigate(['/login']);
    } else {
      this.errorMessage = 'Error al registrar el usuario';
    }
  }

  private handleRegistrationError(error: any): void {
    this.isLoading = false;
    this.errorMessage = 'Error al conectar con el servidor';
    console.error('Error de registro:', error);
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  resetForm(): void {
    if (confirm('¿Estás seguro de que quieres limpiar el formulario?')) {
      this.registerForm.reset({
        pais: 'España',
        terminos: false
      });
      this.selectedFile = null;
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
