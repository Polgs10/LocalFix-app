import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ApiResponse } from './model/ApiResponse.model';
import { HttpStatus } from './model/http-status.const';

interface AuthResponse {
  accessToken: string;
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_TOKEN = 'access_token';
  private readonly USER_DATA = 'user_data';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const accessToken = this.getAccessToken();
    const userData = this.getUserData();

    if (accessToken && userData) {
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(userData);
    }
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
        'http://localhost:8080/api/users/login',
        { email, password },
        {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            }),
            withCredentials: true
        }
    ).pipe(
        tap(response => {
            if (response.status === HttpStatus.OK) {
                this.storeAccessToken(response.data.accessToken);
                this.storeUserData({
                    id: response.data.id,
                    username: response.data.username,
                    email: response.data.email
                });
                this.isAuthenticatedSubject.next(true);
                this.currentUserSubject.next({
                    id: response.data.id,
                    username: response.data.username,
                    email: response.data.email
                });
                this.router.navigate(['/layout', response.data.username]);
            }
        }),
        catchError(error => {
            console.error('Login error:', error);
            return throwError(() => error);
        })
    );
}

  logout(): void {
    this.removeAccessToken();
    this.removeUserData();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private storeAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN, token);
  }

  private removeAccessToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN);
  }

  private storeUserData(userData: any): void {
    localStorage.setItem(this.USER_DATA, JSON.stringify(userData));
  }

  private getUserData(): any {
    const userData = localStorage.getItem(this.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  private removeUserData(): void {
    localStorage.removeItem(this.USER_DATA);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}
