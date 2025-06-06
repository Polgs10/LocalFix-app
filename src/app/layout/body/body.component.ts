import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfessionalCard } from '../../model/professional.model';

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
  username: string | null = null;
  filters = {
    category: '',
    province: '',
    experience: '',
    minRating: '',
    username: ''
  };
  error: string | null = null;
  isLoading = true;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.username = username;
        console.log('Username from route:', this.username);
      } else {
        this.error = 'Professional not found';
        this.isLoading = false;
      }
    });

    this.loadInitialData();
  }

  loadInitialData(): void {
    this.http.get<string[]>('http://localhost:8080/api/guilds/categories').subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Error loading categories', err)
    });

    this.http.get<string[]>('http://localhost:8080/api/professional-locations/provinces').subscribe({
      next: (data) => this.provinces = data,
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
    params.username = this.username

    this.http.get<ProfessionalCard[]>('http://localhost:8080/api/professionals', { params }).subscribe({
      next: (data) => {
        this.professionals = data.map(prof => ({
          ...prof,
          image: this.getProfessionalImage(prof.guild)
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

  private getProfessionalImage(guild: string): string {
    const images: {[key: string]: string} = {
      'Carpintero': 'carpenter.jpg',
      'Fontanero': 'plumber.jpg',
      'Electricista': 'electrician.jpg',
      'Cerrajero': 'locksmith.jpg',
      'Albañil': 'builder.jpg'
    };
    return images[guild] || 'professional-default.jpg';
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
    this.router.navigate([`/details-professional/${this.username}/${professionalUsername}`]);
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
