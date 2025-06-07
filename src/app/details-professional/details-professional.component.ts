import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfessionalDetails, ProfessionalLocation, ProfessionalRating, ProfessionalService } from '../model/professional.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewRating } from '../model/rating.model';
import { UserProfile } from '../model/user.model';

@Component({
  selector: 'app-details-professional',
  imports: [CommonModule, FormsModule],
  templateUrl: './details-professional.component.html',
  styleUrl: './details-professional.component.css'
})
export class DetailsProfessionalComponent {
  professionalId: number | null = null;
  professional: ProfessionalDetails | null = null;
  professionalLocations: ProfessionalLocation[] | null = null;
  professionalServices: ProfessionalService[] | null = null;
  professionalRatings: ProfessionalRating[] | null = null;

  userProfileId: number | null = null;

  newRating: NewRating | null = null;

  businessName: string | null = null;

  isLoading = true;
  error: string | null = null;
  selectedRating = 0;
  showReviewModal = false;
  newReviewComment = '';
  username: string | null = null;
  errorMessage: string | null = null;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.username = username;
        this.loadUserId(username);
      } else {
        this.error = 'Professional not found';
        this.isLoading = false;
      }
    });

    this.route.paramMap.subscribe(params => {
      const businessName = params.get('businessName');
      if (businessName) {
        this.businessName = businessName;
        this.loadProfessionalId(businessName);
      } else {
        this.error = 'Professional not found';
        this.isLoading = false;
      }
    });

  }

  submitReview(): void {
    if (!this.userProfileId || !this.professionalId || this.selectedRating === 0) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos';
      return;
    }

  this.isLoading = true;

  const newRating: NewRating = {
    userId: this.userProfileId,
    professionalId: this.professionalId,
    score: this.selectedRating,
    comment: this.newReviewComment
  };

  this.http.post<any>('http://localhost:8080/api/ratings/new/rating', newRating)
    .subscribe({
      next: (response) => {
        this.closeReviewModal();
        this.resetReviewForm();
        // Recargar las valoraciones para mostrar la nueva
        this.loadProfessionalRatings();
        // Actualizar los detalles del profesional (para el promedio)
        this.loadProfessionalDetails();
      },
      error: (error) => {
        this.errorMessage = 'Error al enviar la valoración. Por favor, inténtalo de nuevo.';
        console.error('Error submitting review:', error);
        this.isLoading = false;
      }
    });
  }

  resetReviewForm(): void {
    this.selectedRating = 0;
    this.newReviewComment = '';
    this.errorMessage = null;
    this.isLoading = false;
  }

  loadUserId(username: string): void {
    this.http.get<number>(`http://localhost:8080/api/users/id/${username}`)
      .subscribe({
        next: (id) => {
          this.userProfileId = id;
        },
        error: (err) => {
          this.error = 'User not found';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadProfessionalId(businessName: string): void {
    this.http.get<number>(`http://localhost:8080/api/professionals/${businessName}/id`)
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
          console.log(data);
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
          console.log('Locations loaded:', data);
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

  goBack(): void {
    this.router.navigate(['/layout', this.username]);
  }

  getSecondaryLocations(): ProfessionalLocation[] {
    if (!this.professionalLocations || this.professionalLocations.length === 0) return [];
    return this.professionalLocations.filter(loc => !loc.primary);
  }

  getPrimaryLocation(): ProfessionalLocation | undefined {
    if (!this.professionalLocations || this.professionalLocations.length === 0) return undefined;
    return this.professionalLocations.find(loc => loc.primary) || this.professionalLocations[0];
  }

  formatBusinessHours(hours: string | undefined): string {
    if (!hours) return '';
    return hours.replace(/\n/g, '<br>');
  }

  getStars(score: number): string[] {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('fas fa-star');
    }

    if (hasHalfStar) {
      stars.push('fas fa-star-half-alt');
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push('far fa-star');
    }

    return stars;
  }

  getRatingDistribution(): {stars: number, count: number, percentage: number}[] {
    if (!this.professionalRatings || !this.professional) return [];

    const distribution = [5, 4, 3, 2, 1].map(stars => {
      const count = this.professionalRatings!.filter(r => Math.round(r.score) === stars).length;
      const percentage = (count / this.professional!.ratingCount) * 100;
      return {stars, count, percentage};
    });

    return distribution;
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return 'No especificado';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }

  getWhatsAppNumber(phone: string | undefined): string {
    if (!phone) return '';
    // Eliminar espacios y caracteres no numéricos
    return phone.replace(/[^\d]/g, '');
  }

  closeReviewModal() {
    this.showReviewModal = false;
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
  }



  showEmailModal = false;
  isSendingEmail = false;
  emailData = {
    from: '',
    to: '', // Se establecerá con el email del profesional
    subject: '',
    body: ''
  };

  openEmailModal(): void {
    this.showEmailModal = true;
    // Establecer el email del profesional si está disponible
    if (this.professional?.email) {
      this.emailData.to = this.professional.email;
    }
  }

  closeEmailModal(): void {
    this.showEmailModal = false;
    this.resetEmailForm();
  }

  resetEmailForm(): void {
    this.emailData = {
      from: '',
      to: this.professional?.email || '',
      subject: '',
      body: ''
    };
    this.isSendingEmail = false;
  }

  sendEmail(): void {
    if (!this.emailData.from || !this.emailData.to || !this.emailData.subject || !this.emailData.body) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos';
      return;
    }

    this.isSendingEmail = true;

    // Opción 1: Abrir el cliente de email del usuario (como está actualmente)
    const subject = encodeURIComponent(this.emailData.subject);
    const body = encodeURIComponent(
      this.emailData.body +
      `\n\nEnviado desde LocalFix por ${this.emailData.from}`
    );

    const mailtoLink = `mailto:${this.emailData.to}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    this.closeEmailModal();
  }
}
