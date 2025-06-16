import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfile, UserProfileLocation, UserProfileRating } from '../model/user.model';
import { FooterComponent } from "../layout/footer/footer.component";
import { AuthService } from '../auth.service';
import { debounceTime, distinctUntilChanged, Observable, of, switchMap, tap } from 'rxjs';


@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;

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

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  emailExists = false;
  checkingEmail = false;
  originalEmail = '';

  private baseImageUrl = "http://localhost:8080/uploads/";

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.username = username;
        this.loadUserId(username);
      } else {
        this.error = 'User not found';
        this.isLoading = false;
      }
    });

  }

  public setupEmailValidation(): void {
    of(this.userProfile?.email).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.checkingEmail = true),
      switchMap(email => {
        if (!email || email === this.originalEmail) {
          return of(false);
        }
        return this.checkEmailAvailability(email);
      })
    ).subscribe({
      next: (exists) => {
        this.emailExists = exists;
        this.checkingEmail = false;
      },
      error: () => this.checkingEmail = false
    });
  }

  private checkEmailAvailability(email: string): Observable<boolean> {
    if (!email) return of(false);
    return this.http.get<boolean>(`http://localhost:8080/api/users/check-email/${email}`);
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  handleProfileUpdate() {
    if (!this.userProfile || !this.userProfileLocation || !this.userProfileId) {
      return;
    }


    if (this.emailExists && this.userProfile.email !== this.originalEmail) {
      alert('Este email ya está registrado');
      return;
    }

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }

    const updateData = {
      name: this.userProfile.name,
      firstName: this.userProfile.firstName,
      lastName: this.userProfile.lastName,
      email: this.userProfile.email,
      phone: this.userProfile.phone,
      address: this.userProfileLocation.address,
      city: this.userProfileLocation.city,
      province: this.userProfileLocation.province,
      postalCode: this.userProfileLocation.postalCode,
      country: this.userProfileLocation.country,
      password: this.newPassword
    };

    this.http.put<boolean>(
      `http://localhost:8080/api/users/update/${this.userProfileId}`,
      updateData
    ).subscribe({
      next: (success) => {
        if (success) {
          alert('Perfil actualizado correctamente');
          this.isEditMode = false;
          this.loadUserProfileDetails();
          this.loadUserProfileLocation();
        } else {
          alert('Error al actualizar el perfil');
        }
      },
      error: (err) => {
        console.error('Error updating profile', err);
        alert('Error al actualizar el perfil');
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
          this.originalEmail = userProfile.email;
          this.setupEmailValidation();
          this.http.get(`http://localhost:8080/api/users/${this.userProfileId}/profile-image`, { responseType: 'text' })
          .subscribe({
            next: (imagePath: string) => {
              if (this.userProfile) {
                this.userProfile.profileImagePath = imagePath
                  ? this.baseImageUrl + imagePath
                  : 'https://via.placeholder.com/120x120';
              }
            },
            error: (err) => {
              console.error('Error loading profile image', err);
              if (this.userProfile) {
                this.userProfile.profileImagePath = 'https://via.placeholder.com/120x120';
              }
            }
  });
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
    if (file && this.userProfileId) {
        const formData = new FormData();
        formData.append('profileImage', file);

        this.http.put<boolean>(
            `http://localhost:8080/api/users/${this.userProfileId}/update-profile-image`,
            formData
        ).subscribe({
            next: (success) => {
                if (success) {
                    // Recargar la imagen de perfil
                    this.loadUserProfileDetails();
                    alert('Imagen de perfil actualizada correctamente');
                } else {
                    alert('Error al actualizar la imagen de perfil');
                }
            },
            error: (err) => {
                console.error('Error updating profile image', err);
                alert('Error al actualizar la imagen de perfil');
            }
        });
    }
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

  deleteAccount(): void {
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      if (!this.userProfileId) return;

      this.http.delete(`http://localhost:8080/api/users/${this.userProfileId}`)
        .subscribe({
          next: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          },
          error: (err) => {
            console.error('Error deleting account', err);
            alert('Error al eliminar la cuenta');
          }
        });
    }
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
