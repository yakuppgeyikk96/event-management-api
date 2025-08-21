import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CategoryType {
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

export interface CategoryFindOneQuery {
  _id: Types.ObjectId;
  isActive: boolean;
}

export interface CategoryFindByOrganizerQuery {
  organizerId: Types.ObjectId;
  isActive: boolean;
}

export interface CategoryFindSystemQuery {
  type: CategoryType;
  isActive: boolean;
}

export interface CategoryFindBySlugQuery {
  slug: string;
  isActive: boolean;
}

export interface CategorySearchQuery {
  $or: Array<
    | {
        type: CategoryType;
        isActive: boolean;
      }
    | {
        organizerId: Types.ObjectId;
        isActive: boolean;
      }
  >;
  name: RegExp;
}

@Schema({ timestamps: true })
export class Category {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: String,
    enum: CategoryType,
    default: CategoryType.CUSTOM,
  })
  type: CategoryType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  organizerId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
export type CategoryDocument = Category & Document;

CategorySchema.index({ type: 1 });
CategorySchema.index({ organizerId: 1 });
CategorySchema.index({ name: 1, type: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ name: 'text', description: 'text' });
CategorySchema.index({ slug: 1 }, { unique: true });
