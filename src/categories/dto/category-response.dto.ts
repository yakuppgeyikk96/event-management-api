export class CategoryResponseDto {
  _id: string;
  name: string;
  originalName?: string;
  description?: string;
  type: string;
  organizerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
