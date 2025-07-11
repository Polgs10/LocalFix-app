import { Component } from '@angular/core';
import { ProfessionalDetails, ProfessionalLocation, ProfessionalRating, ProfessionalService } from '../model/professional.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Service } from '../model/service.model';
import { FooterComponent } from "../layout/footer/footer.component";
import { AuthService } from '../auth.service';
import { ApiResponse } from '../model/ApiResponse.model';
import { debounceTime, distinctUntilChanged, Observable, of, Subject, switchMap, tap } from 'rxjs';

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
  user: any;
  guilds: string[] = [];
  isEditMode = false;
  originalProfessional: ProfessionalDetails | null = null;

  businessNameExists = false;
  emailExists = false;
  checkingBusinessName = false;
  checkingEmail = false;
  originalBusinessName = '';
  originalEmail = '';

  originalImageUrl: string = '';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService) {}

  private baseImageUrl = "http://localhost:8080/uploads/";
  public businessNameSubject = new Subject<string>();
  public emailSubject = new Subject<string>();

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.isProfessional(this.user.username);
    this.loadGuilds();
    this.setupBusinessNameValidation();
    this.setupEmailValidation();
  }



  viewPayment(username: string): void {
    this.router.navigate([`user/professional-profile/payment/${username}`]);
  }

  isProfessional(username: string): void {
    this.http.get<ApiResponse<boolean>>(`http://localhost:8080/api/users/professional/${username}`)
      .subscribe({
        next: (res) => {
          if (res.data === true) {
            this.loadProfessionalId(username);
          } else {
            if (this.user.username) {
              this.viewPayment(this.user.username);
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
    this.http.get<ApiResponse<string[]>>('http://localhost:8080/api/guilds/categories')
      .subscribe({
        next: (res) => this.guilds = res.data,
        error: (err) => console.error('Error loading categories', err)
      })
  }

  loadProfessionalId(username: string): void {
    this.http.get<ApiResponse<number>>(`http://localhost:8080/api/users/professional/id/${username}`)
      .subscribe({
        next: (res) => {
          this.professionalId = res.data;
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

    this.http.get<ApiResponse<ProfessionalDetails>>(`http://localhost:8080/api/professionals/details/${this.professionalId}`)
      .subscribe({
        next: (res) => {
          this.professional = res.data;
          this.originalProfessional = {...res.data};
          this.originalBusinessName = res.data.businessName;
          this.originalEmail = res.data.email;

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

    this.http.get<ApiResponse<ProfessionalLocation[]>>(`http://localhost:8080/api/professional-locations/locations/${this.professionalId}`)
      .subscribe({
        next: (res) => {
          this.professionalLocations = res.data;
        },
        error: (err) => {
          console.error('Error loading locations', err);
        }
      });
  }

  loadProfessionalServices(): void {
    if (!this.professionalId) return;
    this.http.get<ApiResponse<ProfessionalService[]>>(`http://localhost:8080/api/services/services-professional/${this.professionalId}`)
      .subscribe({
        next: (res) => {
          this.professionalServices = res.data;
        },
        error: (err) => {
          console.error('Error loading services', err);
        }
      });
  }

  loadProfessionalRatings(): void {
    if (!this.professionalId) return;
    this.http.get<ApiResponse<ProfessionalRating[]>>(`http://localhost:8080/api/ratings/ratings/${this.professionalId}`)
      .subscribe({
        next: (res) => {
          this.professionalRatings = res.data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Error loading ratings';
          this.isLoading = false;
          console.error(err);
        }
      });
  }



  handleProfileUpdate(event: Event): void {
    event.preventDefault();
    if (!this.professionalId || !this.professional) return;

    if (this.businessNameExists && this.professional.businessName !== this.originalBusinessName) {
      alert('El nombre del negocio ya está en uso');
      return;
    }

    if (this.emailExists && this.professional.email !== this.originalEmail) {
      alert('El email ya está registrado');
      return;
    }

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
    console.log('Location ID:', locationId);
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
    this.router.navigate(['/layout', this.user.username]);
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

  showLocationModall(location?: ProfessionalLocation): void {
    this.showLocationModal = true;
    if (location) {
      this.isEditingLocation = true;
      this.editingLocationId = location.id;
      this.newLocation = {...location};
    } else {
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
    if (!this.newLocation.address || !this.newLocation.city ||
        !this.newLocation.province || !this.newLocation.postalCode ||
        !this.newLocation.country || !this.newLocation.mobilePhone ||
        !this.newLocation.businessHours) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (!this.professionalId) return;

    if (this.isEditingLocation && this.editingLocationId) {

      const originalLocation = this.professionalLocations.find(loc => loc.id === this.editingLocationId);

      const updatedLocation = {
        ...this.newLocation,
        isPrimary: originalLocation ? originalLocation.primary : false
      };

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

  deleteProfessionalAccount(): void {
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta profesional? Esta acción no se puede deshacer.')) {
      if (!this.professionalId) return;

      this.http.delete(`http://localhost:8080/api/professionals/${this.professionalId}`)
        .subscribe({
          next: () => {
            // Redirigir al layout
            this.router.navigate(['/layout', this.user.username]);
          },
          error: (err) => {
            console.error('Error deleting professional account', err);
            alert('Error al eliminar la cuenta profesional');
          }
        });
    }
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

  private setupBusinessNameValidation(): void {
    this.businessNameSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.checkingBusinessName = true),
      switchMap(name => this.checkBusinessNameAvailability(name))
    ).subscribe({
      next: exists => {
        this.businessNameExists = exists;
        this.checkingBusinessName = false;
      },
      error: () => this.checkingBusinessName = false
    });
  }

  private setupEmailValidation(): void {
    this.emailSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.checkingEmail = true),
      switchMap(email => this.checkEmailAvailability(email))
    ).subscribe({
      next: exists => {
        this.emailExists = exists;
        this.checkingEmail = false;
      },
      error: () => this.checkingEmail = false
    });
  }

  private checkBusinessNameAvailability(businessName: string): Observable<boolean> {
    if (!businessName || businessName === this.originalBusinessName) {
      return of(false);
    }
    return this.http.get<boolean>(
      `http://localhost:8080/api/professionals/check-business-name/${businessName}`
    );
  }

  private checkEmailAvailability(email: string): Observable<boolean> {
    if (!email || email === this.originalEmail) {
      return of(false);
    }
    return this.http.get<boolean>(
      `http://localhost:8080/api/professionals/check-email/${email}`
    );
  }
}
