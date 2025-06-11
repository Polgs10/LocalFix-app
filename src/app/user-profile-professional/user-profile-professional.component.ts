import { Component } from '@angular/core';
import { ProfessionalDetails, ProfessionalLocation, ProfessionalRating, ProfessionalService } from '../model/professional.model';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Service } from '../model/service.model';
import { FooterComponent } from "../layout/footer/footer.component";

@Component({
  selector: 'app-user-profile-professional',
  imports: [CommonModule, FormsModule, FooterComponent],
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

  private baseImageUrl = "http://localhost:8080/uploads/";

  originalImageUrl: string = '';

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

          this.http.get(`http://localhost:8080/api/professionals/${this.professionalId}/business-image`,
            { responseType: 'text' })
            .subscribe({
              next: (imagePath: string) => {
                if (this.professional) {
                  this.professional.imageUrl = imagePath
                    ? this.baseImageUrl + imagePath
                    : 'https://via.placeholder.com/120x120';
                  this.originalImageUrl = this.professional.imageUrl; // Guarda la URL original
                }
              },
              error: (err) => {
                console.error('Error loading business image', err);
                if (this.professional) {
                  this.professional.imageUrl = 'https://via.placeholder.com/120x120';
                  this.originalImageUrl = this.professional.imageUrl; // Guarda la URL original incluso si hay error
                }
              }
            });
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
          console.log(data);
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
    if (!this.isEditMode) {
        this.cancelProfileEdit();
    }
  }

  cancelProfileEdit(): void {
    this.isEditMode = false;
    if (this.originalProfessional && this.professional) {
        this.professional = {...this.originalProfessional};
        this.professional.imageUrl = this.originalImageUrl;
    }
  }

  handleProfileUpdate(event: Event): void {
    event.preventDefault();
    if (!this.professionalId || !this.professional) return;

    const updateRequest = {
      professionalId: this.professionalId,
      businessName: this.professional.businessName,
      email: this.professional.email,
      description: this.professional.description,
      experience: this.professional.experience,
      guildName: this.professional.guild
    };

    this.http.put(`http://localhost:8080/api/professionals/update`, updateRequest)
      .subscribe({
        next: () => {
          this.originalProfessional = {...this.professional!};
          this.isEditMode = false;
          alert('Perfil actualizado correctamente');
          // Recargar los datos para asegurar consistencia
          this.loadProfessionalDetails();
        },
        error: (err) => {
          console.error('Error updating professional details', err);
          alert('Error al actualizar el perfil');
        }
      });
  }

  toggleProfileStatus(): void {
    if (!this.professional || !this.professionalId) return;

    const newStatus = !this.professional.active;

    this.http.put(`http://localhost:8080/api/professionals/${this.professionalId}/status`, newStatus)
      .subscribe({
        next: () => {
          this.professional!.active = newStatus;
          if (this.originalProfessional) {
            this.originalProfessional.active = newStatus;
          }
          const message = newStatus
            ? 'Perfil activado correctamente'
            : 'Perfil desactivado correctamente';
          alert(message);
        },
        error: (err) => {
          console.error('Error updating professional status', err);
          alert('Error al actualizar el estado del perfil');
          this.professional!.active = !newStatus;
        }
      });
  }

  handleBusinessImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0] || !this.professionalId) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('businessImage', file);

    this.http.put<boolean>(
      `http://localhost:8080/api/professionals/${this.professionalId}/update-business-image`,
      formData
    ).subscribe({
      next: (success) => {
        if (success) {
          // Recargar la imagen del negocio
          this.loadProfessionalDetails();
          alert('Imagen del negocio actualizada correctamente');
        } else {
          alert('Error al actualizar la imagen del negocio');
        }
      },
      error: (err) => {
        console.error('Error updating business image', err);
        alert('Error al actualizar la imagen del negocio');
      }
    });
  }

  setPrimaryLocation(locationId: number): void {
    console.log('Location ID:', locationId); // Verifica que tenga un valor válido
    if (!locationId) {
      alert('Error: ID de ubicación no válido');
      return;
    }

    this.http.put(
      `http://localhost:8080/api/professional-locations/${this.professionalId}/${locationId}`,
      {}
    ).subscribe({
      next: () => {
        this.professionalLocations = this.professionalLocations.map(loc => ({
          ...loc,
          primary: loc.id === locationId
        }));
      },
      error: (err) => {
        console.error('Error al actualizar la ubicación primaria', err);
        alert('Error al cambiar la ubicación primaria');
      }
    });
  }

  deleteService(service: ProfessionalService): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el servicio "${service.name}"?`)) {
      this.http.delete(`http://localhost:8080/api/services/${service.id}`)
        .subscribe({
          next: () => {
            this.professionalServices = this.professionalServices.filter(s => s.id !== service.id);
          },
          error: (err) => {
            console.error('Error deleting service', err);
            alert('Error to delete service');
          }
        });
    }
  }

  goBack() {
    this.router.navigate(['/layout', this.username]);
  }

  isEditingService: boolean | null = null;
  showServiceModal: boolean | null = null;
  editingServiceName: string | null = null;
  serviceId: number | null = null;

  newService: Service = {
    professionalId: this.professionalId || 0,
    name: '',
    description: '',
    price: 0,
    estimatedDuration: 1
  };

  addService(): void {
    this.newService = {
      professionalId: this.professionalId || 0,
      name: '',
      description: '',
      price: 0,
      estimatedDuration: 1
    };
    this.isEditingService = false;
    this.showServiceModal = true;
  }

  editService(service: ProfessionalService): void {
    this.newService = {
      professionalId: this.professionalId || 0,
      name: service.name,
      description: service.description,
      price: service.price,
      estimatedDuration: service.estimatedDuration
    };
    this.isEditingService = true;
    this.editingServiceName = service.name;
    this.serviceId = service.id
    this.showServiceModal = true;
  }

  saveService(): void {
    if (!this.professionalId) return;

    if (this.isEditingService) {

      this.http.put(`http://localhost:8080/api/services/${this.serviceId}`, this.newService)
      .subscribe({
        next: () => {
          this.loadProfessionalServices();
          this.showServiceModal = false;
        },
        error: (err) => {
          console.error('Error updating service', err);
        }
      });
    } else {
      this.http.post(`http://localhost:8080/api/services`, this.newService)
      .subscribe({
        next: () => {
          this.loadProfessionalServices();
          this.showServiceModal = false;
        },
        error: (err) => {
          console.error('Error creating service', err);
        }
      });
    }
  }

  showLocationModal = false;
  isEditingLocation = false;
  editingLocationId: number | null = null;

  newLocation: ProfessionalLocation = {
    id: 0,
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    landlinePhone: '',
    mobilePhone: '',
    businessHours: '',
    primary: false
  };

  showLocationModall(location?: ProfessionalLocation): void {
    this.showLocationModal = true;
    if (location) {
      // Modo edición
      this.isEditingLocation = true;
      this.editingLocationId = location.id;
      this.newLocation = {...location};
    } else {
      // Modo creación
      this.isEditingLocation = false;
      this.editingLocationId = null;
      this.newLocation = {
        id: 0,
        address: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        landlinePhone: '',
        mobilePhone: '',
        businessHours: '',
        primary: false
      };
    }
  }

  saveLocation(): void {
  // Validar que todos los campos requeridos están completos
    if (!this.newLocation.address || !this.newLocation.city ||
        !this.newLocation.province || !this.newLocation.postalCode ||
        !this.newLocation.country || !this.newLocation.mobilePhone ||
        !this.newLocation.businessHours) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    // Resto de tu lógica de guardado...
    if (!this.professionalId) return;

    if (this.isEditingLocation && this.editingLocationId) {

      const originalLocation = this.professionalLocations.find(loc => loc.id === this.editingLocationId);

      // Actualizar ubicación existente - incluir el campo primary
      const updatedLocation = {
        ...this.newLocation,
        isPrimary: originalLocation ? originalLocation.primary : false
      };

      // Actualizar ubicación existente
      this.http.put(`http://localhost:8080/api/professional-locations/${this.editingLocationId}`, updatedLocation)
        .subscribe({
          next: () => {
            this.loadProfessionalLocations();
            this.showLocationModal = false;
          },
          error: (err) => {
            console.error('Error updating location', err);
            alert('Error al actualizar la ubicación');
          }
        });
    } else {
      // Crear nueva ubicación
      this.http.post(`http://localhost:8080/api/professional-locations/${this.professionalId}`, this.newLocation).subscribe({
        next: () => {
          this.loadProfessionalLocations();
          this.showLocationModal = false;
        },
        error: (err) => {
          console.error('Error creating location', err);
          alert('Error al crear la ubicación');
        }
      });
    }
  }

  deleteLocation(locationId: number): void {
    const location = this.professionalLocations.find(loc => loc.id === locationId);

    if (!location) return;

    if (location.primary) {
      alert('No se puede eliminar la ubicación primaria');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      this.http.delete(`http://localhost:8080/api/professional-locations/${locationId}`)
        .subscribe({
          next: () => {
            this.professionalLocations = this.professionalLocations.filter(loc => loc.id !== locationId);
          },
          error: (err) => {
            console.error('Error deleting location', err);
            alert('Error al eliminar la ubicación');
          }
        });
    }
  }
}
