import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register-professional',
  imports: [CommonModule, FormsModule],
  templateUrl: './register-professional.component.html',
  styleUrl: './register-professional.component.css'
})
export class RegisterProfessionalComponent {

  username: string | null = null;
  error: string | null = null;
  isLoading = true;
  userProfileId: number | null = null;
  guilds: string[] = [];
  selectedFile: File | null = null;
  imagePreview: string = 'https://via.placeholder.com/120x120?text=Logo';

  // Datos del formulario
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

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.username = username;
        this.loadUserId(username);
      } else {
        this.error = 'User not found';
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/user/professional-profile/payment/', this.username]);
  }

  loadUserId(username: string): void {
    this.http.get<number>(`http://localhost:8080/api/users/id/${username}`)
      .subscribe({
        next: (id) => {
          this.userProfileId = id;
          this.loadGuilds();
        },
        error: (err) => {
          this.error = 'User not found';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadGuilds(): void {
    this.http.get<string[]>('http://localhost:8080/api/guilds/categories').subscribe({
      next: (data) => {
        this.guilds = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Mostrar vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (!this.username || !this.userProfileId) {
      this.error = 'User information not available';
      return;
    }

    // Validación básica
    if (!this.professionalData.businessName ||
        !this.professionalData.guild ||
        !this.professionalData.mobilePhone) {
      this.error = 'Por favor, complete los campos obligatorios';
      return;
    }

    const formData = new FormData();

    // Agregar la imagen si existe
    if (this.selectedFile) {
      formData.append('businessPhoto', this.selectedFile);
    }

    // Agregar los datos del profesional
    const requestData = {
      username: this.username,
      ...this.professionalData
    };
    formData.append('professionalData', JSON.stringify(requestData));

    this.isLoading = true;

    // Primero enviar los datos del profesional
    this.http.post<boolean>('http://localhost:8080/api/professionals', requestData)
      .subscribe({
        next: (isCreated) => {
          if (isCreated) {
            this.router.navigate(['/user/professional-profile/', this.username]);
          }
        },
        error: (err) => {
          this.error = 'Error registering professional';
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  uploadImage(username: string): void {
    if (!this.selectedFile) return;

    const imageFormData = new FormData();
    imageFormData.append('image', this.selectedFile);

    this.http.post(`http://localhost:8080/api/professionals/${username}/upload-photo`, imageFormData)
      .subscribe({
        next: () => {
          this.router.navigate(['/user/professional-profile', this.username]);
        },
        error: (err) => {
          console.error('Error uploading image', err);
          // Aunque falle la imagen, redirigir igual
          this.router.navigate(['/user/professional-profile', this.username]);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  cancelRegistration(): void {
    this.router.navigate(['/layout', this.username]);
  }
}
