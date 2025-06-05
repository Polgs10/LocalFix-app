export interface UserProfile {
  id: number;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  date: string;
  ratingCount: number;
  averageRating: number;
}

export interface UserProfileLocation {
  id: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface UserProfileRating{
  businessName: string;
  score: number;
  comment: string;
  date: string;
}
