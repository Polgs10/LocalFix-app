import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Professional {
  id: number;
  name: string;
  guild: string;
  experience: number;
  description: string;
  rating: number;
  province: string;
  image?: string;
}


@Component({
  selector: 'app-body',
  imports: [CommonModule, FormsModule],
  templateUrl: './body.component.html',
  styleUrl: './body.component.css'
})
export class BodyComponent {
  categories: string[] = [];
  provinces: string[] = [];
  professionals: Professional[] = [];
  filters = {
    category: '',
    province: '',
    priceRange: '',
    minRating: ''
  };
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    // Cargar categorías de gremios
    this.http.get<string[]>('http://localhost:8080/api/guilds/categories').subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Error loading categories', err)
    });

    // Cargar profesionales
    this.loadProfessionals();
  }

  loadProfessionals(): void {
    this.isLoading = true;
    let params: any = {};

    if (this.filters.category) params.guildId = this.filters.category;
    if (this.filters.province) params.province = this.filters.province;

    this.http.get<Professional[]>('http://localhost:8080/api/professionals', { params }).subscribe({
      next: (data) => {
        this.professionals = data.map(prof => ({
          ...prof,
          image: this.getProfessionalImage(prof.guild) // Asignar imagen según gremio
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
      priceRange: '',
      minRating: ''
    };
    this.loadProfessionals();
  }

  private getProfessionalImage(guild: string): string {
    // Mapeo de gremios a imágenes (ajusta según tus assets)
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
      if (i < fullStars) return 2; // Estrella llena
      if (i === fullStars && hasHalfStar) return 1; // Media estrella
      return 0; // Estrella vacía
    });
  }
}
