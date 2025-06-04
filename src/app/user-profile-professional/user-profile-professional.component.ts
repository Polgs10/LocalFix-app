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
  professionalLocations: ProfessionalLocation[] | null = null;
  professionalServices: ProfessionalService[] | null = null;
  professionalRatings: ProfessionalRating[] | null = null;
  isLoading = true;
  error: string | null = null;
  selectedRating = 0;
  showReviewModal = false;
  newReviewComment = '';
  username: string | null = null;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.username = username;
      } else {
        this.error = 'Professional not found';
        this.isLoading = false;
      }
    });

    this.route.paramMap.subscribe(params => {
      const businessName = params.get('businessName');
      if (businessName) {
        this.loadProfessionalId(businessName);
      } else {
        this.error = 'Professional not found';
        this.isLoading = false;
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

  getPrimaryLocation(): ProfessionalLocation | undefined {
    if (!this.professionalLocations || this.professionalLocations.length === 0) return undefined;
    return this.professionalLocations.find(loc => !loc.primary) || this.professionalLocations[0];
  }

  getSecondaryLocations(): ProfessionalLocation[] {
    if (!this.professionalLocations || this.professionalLocations.length <= 1) return [];
    const primaryId = this.getPrimaryLocation()?.id;
    return this.professionalLocations.filter(loc => loc.primary && loc.id !== primaryId);
  }

  formatBusinessHours(hours: string | undefined): string {
    if (!hours) return '';
    return hours.replace(/\n/g, '<br>');
  }

  getRatingStars(score: number): number[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (score >= i) {
        stars.push(2); // estrella llena
      } else if (score >= i - 0.5) {
        stars.push(1); // media estrella
      } else {
        stars.push(0); // estrella vacía
      }
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
    this.selectedRating = 0;
    this.newReviewComment = '';
  }

  submitReview(): void {
    if (!this.professionalId || this.selectedRating === 0) return;

    const newRating: Omit<ProfessionalRating, 'id' | 'date'> = {
      username: 'Usuario Anónimo', // You might want to use the actual user name
      score: this.selectedRating,
      comment: this.newReviewComment
    };

    this.http.post(`http://localhost:8080/api/ratings/${this.professionalId}`, newRating)
      .subscribe({
        next: () => {
          this.loadProfessionalRatings();
          if (this.professional) {
            this.professional.ratingCount += 1;
            // Recalculate average rating - you might want to get this from the server instead
            const total = this.professionalRatings?.reduce((sum, rating) => sum + rating.score, 0) || 0;
            this.professional.averageRating = (total + this.selectedRating) / (this.professional.ratingCount);
          }
          this.closeReviewModal();
        },
        error: (err) => {
          console.error('Error submitting review', err);
          // Handle error appropriately
        }
      });
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
  }
}
