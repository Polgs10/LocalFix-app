export interface ProfessionalDetails {
  id: number;
  businessName: string;
  guild: string;
  experience: number;
  description: string;
  email: string;
  averageRating: number;
  ratingCount: number;
  imageUrl?: string;
  active: boolean;
}

export interface ProfessionalCard {
  id: number;
  businessName: string;
  guild: string;
  experience: number;
  description: string;
  rating: number;
  province: string;
  image?: string;
}

export interface ProfessionalLocation {
  id: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  landlinePhone: string;
  mobilePhone: string;
  businessHours: string;
  primary: boolean;
}

export interface ProfessionalService {
  id: number;
  name: string;
  description: string;
  price: number;
  estimatedDuration: number;
}

export interface ProfessionalRating {
  username: string;
  score: number;
  comment: string;
  date: string;
}
