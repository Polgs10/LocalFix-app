import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfessionalCard } from '../../model/professional.model';
import { ApiResponse } from '../../model/ApiResponse.model';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-body',
  imports: [CommonModule, FormsModule],
  templateUrl: './body.component.html',
  styleUrl: './body.component.css'
})
export class BodyComponent {
  categories: string[] = [];
  provinces: string[] = [];
  professionals: ProfessionalCard[] = [];
  user: any;
  filters = {
    category: '',
    province: '',
    experience: '',
    minRating: '',
    username: ''
  };
  error: string | null = null;
  isLoading = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.user = this.authService.getCurrentUser();

    this.loadInitialData();
  }

  loadInitialData(): void {
    this.http.get<ApiResponse<string[]>>('http://localhost:8080/api/guilds/categories')
    .subscribe({
      next: (res) => this.categories = res.data,
      error: (err) => console.error('Error loading categories', err)
    })

    this.http.get<ApiResponse<string[]>>('http://localhost:8080/api/professional-locations/provinces').subscribe({
      next: (res) => this.provinces = res.data,
      error: (err) => console.error('Error loading categories', err)
    });

    this.loadProfessionals();
  }

  loadProfessionals(): void {
    this.isLoading = true;
    let params: any = {};

    if (this.filters.category) params.category = this.filters.category;
    if (this.filters.province) params.province = this.filters.province;
    if (this.filters.experience) params.experience = this.filters.experience;
    if (this.filters.minRating) params.minRating = this.filters.minRating;
    params.username = this.user.username

    this.http.get<ApiResponse<ProfessionalCard[]>>('http://localhost:8080/api/professionals', { params }).subscribe({
      next: (res) => {
        this.professionals = res.data.map(prof => ({
          ...prof,
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading professionals', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadProfessionals();
  }

  clearFilters(): void {
    this.filters = {
      category: '',
      province: '',
      experience: '',
      minRating: '',
      username: ''
    };
    this.loadProfessionals();
  }

  getRatingStars(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return Array(5).fill(0).map((_, i) => {
      if (i < fullStars) return 2;
      if (i === fullStars && hasHalfStar) return 1;
      return 0; //
    });
  }

  viewProfessionalDetails(professionalUsername: string): void {
    this.router.navigate([`/details-professional/${this.user.username}/${professionalUsername}`]);
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
}
