import { Component } from '@angular/core';
import { ProfessionalDetails, ProfessionalLocation, ProfessionalRating, ProfessionalService } from '../model/professional.model';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile-professional',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile-professional.component.html',
  styleUrl: './user-profile-professional.component.css'
})
export class UserProfileProfessionalComponent {
  professionalId: number | null = null;
  professional: ProfessionalDetails | null = null;
  professionalLocations: ProfessionalLocation[] = [];
  professionalServices: ProfessionalService[] = [];
  professionalRatings: ProfessionalRating[] = [];
  isLoading = true;
  error: string | null = null;
  selectedRating = 0;
  showReviewModal = false;
  newReviewComment = '';
  username: string | null = null;
  guilds: string[] = [];
  isEditMode = false;
  originalProfessional: ProfessionalDetails | null = null;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.username = username;
        this.isProfessional(username);
        this.loadGuilds();
      } else {
        this.error = 'Professional not found';
        this.isLoading = false;
      }
    });
  }

  getStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('fas fa-star');
    }

    if (hasHalfStar) {
      stars.push('fas fa-star-half-alt');
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push('far fa-star');
    }

    return stars;
  }

  viewPayment(username: string): void {
    this.router.navigate([`user/professional-profile/payment/${username}`]);
  }

  isProfessional(username: string): void {
    this.http.get<boolean>(`http://localhost:8080/api/users/professional/${username}`)
      .subscribe({
        next: (isProfessional) => {
          if (isProfessional) {
            this.loadProfessionalId(username);
          } else {
            if (this.username) {
              this.viewPayment(this.username);
            }
          }
        },
        error: (err) => {
          this.error = 'Professional not found';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadGuilds(): void {
    this.http.get<string[]>('http://localhost:8080/api/guilds/categories').subscribe({
      next: (data) => this.guilds = data,
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadProfessionalId(username: string): void {
    this.http.get<number>(`http://localhost:8080/api/users/professional/id/${username}`)
      .subscribe({
        next: (id) => {
          this.professionalId = id;
          this.loadProfessionalDetails();
          this.loadProfessionalLocations();
          this.loadProfessionalServices();
          this.loadProfessionalRatings();
        },
        error: (err) => {
          this.error = 'Professional not found';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadProfessionalDetails(): void {
    if (!this.professionalId) return;

    this.http.get<ProfessionalDetails>(`http://localhost:8080/api/professionals/${this.professionalId}/details`)
      .subscribe({
        next: (data) => {
          this.professional = data;
          this.originalProfessional = {...data};
        },
        error: (err) => {
          console.error('Error loading professional details', err);
        }
      });
  }

  loadProfessionalLocations(): void {
    if (!this.professionalId) return;

    this.http.get<ProfessionalLocation[]>(`http://localhost:8080/api/professional-locations/${this.professionalId}/locations`)
      .subscribe({
        next: (data) => {
          this.professionalLocations = data;
        },
        error: (err) => {
          console.error('Error loading locations', err);
        }
      });
  }

  loadProfessionalServices(): void {
    if (!this.professionalId) return;
    this.http.get<ProfessionalService[]>(`http://localhost:8080/api/services/${this.professionalId}/services`)
      .subscribe({
        next: (data) => {
          this.professionalServices = data;
        },
        error: (err) => {
          console.error('Error loading services', err);
        }
      });
  }

  loadProfessionalRatings(): void {
    if (!this.professionalId) return;
    this.http.get<ProfessionalRating[]>(`http://localhost:8080/api/ratings/${this.professionalId}/ratings`)
      .subscribe({
        next: (data) => {
          this.professionalRatings = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Error loading ratings';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode && this.originalProfessional && this.professional) {
      this.professional = {...this.originalProfessional};
    }
  }

  cancelProfileEdit(): void {
    this.isEditMode = false;
    if (this.originalProfessional && this.professional) {
      this.professional = {...this.originalProfessional};
    }
  }

  handleProfileUpdate(event: Event): void {
    event.preventDefault();
    if (!this.professionalId || !this.professional) return;

    this.http.put(`http://localhost:8080/api/professionals/${this.professionalId}/details`, this.professional)
      .subscribe({
        next: () => {
          this.originalProfessional = {...this.professional!};
          this.isEditMode = false;
          alert('Perfil actualizado correctamente');
        },
        error: (err) => {
          console.error('Error updating professional details', err);
          alert('Error al actualizar el perfil');
        }
      });
  }

  toggleProfileStatus(): void {
    if (!this.professional) return;

    this.professional.active = !this.professional.active;
    this.http.put(`http://localhost:8080/api/professionals/${this.professionalId}/status`, { active: this.professional.active })
      .subscribe({
        next: () => {
          if (this.professional) {
            this.originalProfessional = {...this.professional};
          }
        },
        error: (err) => {
          console.error('Error updating professional status', err);
          if (this.professional && this.originalProfessional) {
            this.professional.active = this.originalProfessional.active;
          }
        }
      });
  }

  handleBusinessImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0] || !this.professionalId) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('image', file);

    this.http.post(`http://localhost:8080/api/professionals/${this.professionalId}/image`, formData)
      .subscribe({
        next: (response: any) => {
          if (this.professional) {
            this.professional.imageUrl = response.imageUrl;
            this.originalProfessional = {...this.professional};
          }
        },
        error: (err) => {
          console.error('Error uploading image', err);
        }
      });
  }

  showLocationModal(locationId?: number): void {
    // Implementar lógica para mostrar modal de ubicación
    if (locationId) {
      alert(`Editar ubicación ${locationId}`);
    } else {
      alert('Añadir nueva ubicación');
    }
  }

  setPrimaryLocation(locationId: number): void {
    this.http.put(`http://localhost:8080/api/professional-locations/${locationId}/primary`, {})
      .subscribe({
        next: () => {
          this.professionalLocations = this.professionalLocations.map(loc => ({
            ...loc,
            primary: loc.id === locationId
          }));
        },
        error: (err) => {
          console.error('Error setting primary location', err);
        }
      });
  }

  editLocation(locationId: number): void {
    this.showLocationModal(locationId);
  }

  deleteLocation(locationId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      this.http.delete(`http://localhost:8080/api/professional-locations/${locationId}`)
        .subscribe({
          next: () => {
            this.professionalLocations = this.professionalLocations.filter(loc => loc.id !== locationId);
          },
          error: (err) => {
            console.error('Error deleting location', err);
          }
        });
    }
  }

  addService(): void {
    // Implementar lógica para añadir servicio
    alert('Añadir nuevo servicio');
  }

  editService(service: ProfessionalService): void {
    // Implementar lógica para editar servicio
    alert(`Editar servicio: ${service.name}`);
  }

  deleteService(service: ProfessionalService): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el servicio "${service.name}"?`)) {
      this.http.delete(`http://localhost:8080/api/services/${this.professionalId}/${service.name}`)
        .subscribe({
          next: () => {
            this.professionalServices = this.professionalServices.filter(s => s.name !== service.name);
          },
          error: (err) => {
            console.error('Error deleting service', err);
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
