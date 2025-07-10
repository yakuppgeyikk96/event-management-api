import { EventStatus, PricingType } from '../entities/event.entity';

export class LocationResponseDto {
  address: string;
  city: string;
  country: string;
}

export class PricingResponseDto {
  type: PricingType;
  currency: string;
  price: number;
}

export class CategoryResponseDto {
  _id: string;
  name: string;
  type: string;
}

export class OrganizerResponseDto {
  _id: string;
  name: string;
  email: string;
}

export class EventResponseDto {
  _id: string;
  title: string;
  description: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  location: LocationResponseDto;
  category: CategoryResponseDto;
  organizer: OrganizerResponseDto;
  status: EventStatus;
  capacity: number;
  currentAttendees: number;
  pricing: PricingResponseDto;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
