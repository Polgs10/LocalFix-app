import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ApiResponse } from '../model/ApiResponse.model';

@Component({
  selector: 'app-register-professional',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-professional.component.html',
  styleUrl: './register-professional.component.css'
})
export class RegisterProfessionalComponent {

  user: any;
  error: string | null = null;
  isLoading = true;
  guilds: string[] = [];
  selectedFile: File | null = null;
  imagePreview: string = 'https://via.placeholder.com/120x120?text=Logo';

  professionalData = {
    businessName: '',
    guild: '',
    experience: 0,
    description: '',
    landlinePhone: '',
    mobilePhone: '',
    address: '',
    city: '',
    postalCode: '',
    email: '',
    province: '',
    country: 'España',
    businessHours: '',
    isPrimary: true
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.isLoading = false;
    this.loadGuilds();
  }

  goBack() {
    this.router.navigate(['/user/professional-profile/payment/', this.user.username]);
  }

  loadGuilds(): void {
    this.http.get<ApiResponse<string[]>>('http://localhost:8080/api/guilds/categories')
      .subscribe({
        next: (res) => this.guilds = res.data,
        error: (err) => console.error('Error loading categories', err)
      })
  }

  onSubmit(): void {
    if (!this.user.username || !this.user.id) {
      this.error = 'User information not available';
      this.isLoading = false;
      return;
    }

    if (!this.professionalData.businessName ||
      !this.professionalData.guild ||
      !this.professionalData.mobilePhone ||
      !this.professionalData.email ||
      !this.professionalData.description ||
      !this.professionalData.address ||
      !this.professionalData.city ||
      !this.professionalData.postalCode ||
      !this.professionalData.province ||
      !this.professionalData.country ||
      !this.professionalData.businessHours) {
      this.error = 'Por favor, complete los campos obligatorios';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    const requestData = {
      username: this.user.username,
      ...this.professionalData
    };

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('professionalData', JSON.stringify(requestData));
      formData.append('businessImage', this.selectedFile);

      this.http.post<boolean>('http://localhost:8080/api/professionals/register-with-image', formData)
        .subscribe({
          next: (isCreated) => {
            if (isCreated) {
              this.router.navigate(['/user/professional-profile/', this.user.username]);
            }
          },
          error: (err) => {
            this.error = 'Error registering professional';
            console.error(err);
            this.isLoading = false;
          }
        });
    } else {
      this.http.post<boolean>('http://localhost:8080/api/professionals', requestData)
        .subscribe({
          next: (isCreated) => {
            if (isCreated) {
              this.router.navigate(['/user/professional-profile/', this.user.username]);
            }
          },
          error: (err) => {
            this.error = 'Error registering professional';
            console.error(err);
            this.isLoading = false;
          }
        });
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

  cancelRegistration(): void {
    this.router.navigate(['/layout', this.user.username]);
  }
}
