import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfessionalDetails, ProfessionalLocation, ProfessionalRating, ProfessionalService } from '../model/professional.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  isLoading = true;
  error: string | null = null;
  selectedRating = 0;
  showReviewModal = false;
  newReviewComment = '';

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
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
          console.log('Professional details loaded:', this.professional);
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
          console.log('Services loaded:', this.professionalServices);
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
          console.log('Ratings loaded:', this.professionalRatings);
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
    this.router.navigate(['/layout']);
  }

  getPrimaryLocation(): ProfessionalLocation | undefined {
    if (!this.professionalLocations || this.professionalLocations.length === 0) return undefined;
    return this.professionalLocations.find(loc => loc.isPrimary) || this.professionalLocations[0];
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
  }

  submitReview() : void {
    console.log('Review submitted');
    this.closeReviewModal?.();
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
  }
}
