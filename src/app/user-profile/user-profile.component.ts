import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfile, UserProfileLocation, UserProfileRating } from '../model/user.model';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  isEditMode = false;
  originalValues: any = {};
  document: File | null = null;
  username: string | null = null;
  error: string | null = null;
  isLoading = true;

  userProfileId: number | null = null;
  userProfile: UserProfile | null = null;
  userProfileLocation: UserProfileLocation | null = null;
  userProfileRatings: UserProfileRating[] | null = null;

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

  }

  loadUserId(username: string): void {
    this.http.get<number>(`http://localhost:8080/api/users/id/${username}`)
      .subscribe({
        next: (id) => {
          this.userProfileId = id;

          this.loadUserProfileDetails();
          this.loadUserProfileLocation();
          this.loadUserProfileRatings();
        },
        error: (err) => {
          this.error = 'User not found';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  loadUserProfileDetails(): void {
    if (!this.userProfileId) return;

    this.http.get<UserProfile>(`http://localhost:8080/api/users/details/${this.userProfileId}`)
      .subscribe({
        next: (userProfile) => {
          this.userProfile = userProfile;
          console.log('User Profile Details:', this.userProfile);
        },
        error: (err) => {
          console.error('Error loading user details', err);
        }
      });

  }

  loadUserProfileLocation(): void {
    if (!this.userProfileId) return;

    this.http.get<UserProfileLocation>(`http://localhost:8080/api/personal-locations/location/${this.userProfileId}`)
      .subscribe({
        next: (userProfileLocation) => {
          this.userProfileLocation = userProfileLocation;
          console.log('User Profile Location:', this.userProfileLocation);
        },
        error: (err) => {
          console.error('Error loading user locations', err);
        }
      });

  }

  compareFn(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.toLowerCase() === o2.toLowerCase() : o1 === o2;
  }

  loadUserProfileRatings(): void {
    if (!this.userProfileId) return;

    this.http.get<UserProfileRating[]>(`http://localhost:8080/api/ratings/user/${this.userProfileId}`)
      .subscribe({
        next: (userProfileRatings) => {
          this.userProfileRatings = userProfileRatings;
          console.log('User Profile Ratings:', this.userProfileRatings);
        },
        error: (err) => {
          console.error('Error loading user ratings', err);
        }
      });

  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  handleImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Aquí puedes manejar la nueva imagen de perfil
        // Por ejemplo, actualizar userData.profileImage
      };
      reader.readAsDataURL(file);
    }
  }

  handleProfileUpdate() {
    alert('Perfil actualizado correctamente');

    this.isEditMode = false;
  }

  goBack() {
    this.router.navigate(['/layout', this.username]);
  }

  // Métodos adicionales para el componente
  getYearsAsMember(): number {
    if (!this.userProfile?.date) return 0;
    const joinDate = new Date(this.userProfile.date);
    const today = new Date();
    return today.getFullYear() - joinDate.getFullYear();
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
