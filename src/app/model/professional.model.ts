export interface ProfessionalDetails {
  id: number;
  businessName: string;
  guild: string;
  experience: number;
  description: string;
  averageRating: number;
  ratingCount: number;
  imageUrl?: string;
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
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  businessHours: string;
  isPrimary: boolean;
}

export interface ProfessionalService {
  name: string;
  description: string;
  price: number;
  estimatedDuration: number;
}

export interface ProfessionalRating {
  userName: string;
  score: number;
  comment: string;
  date: string;
}
