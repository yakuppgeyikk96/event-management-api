import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PricingType {
  FREE = 'free',
  PAID = 'paid',
}

export interface EventLocation {
  address: string;
  city: string;
  country: string;
}

export interface EventPricing {
  type: PricingType;
  currency: string;
  price: number;
}

// Query interfaces for type safety
export interface EventFindByOrganizerQuery {
  organizerId: Types.ObjectId;
  isActive: boolean;
}

export interface EventFindPublicQuery {
  status: EventStatus;
  isActive: boolean;
  startDate: { $gte: Date };
  categoryId?: Types.ObjectId;
  'location.city'?: { $regex: RegExp; $options: string };
  'pricing.price'?: { $gte?: number; $lte?: number };
}

export interface EventSearchQuery {
  $or: Array<
    | {
        status: EventStatus;
        isActive: boolean;
      }
    | {
        organizerId: Types.ObjectId;
        isActive: boolean;
      }
  >;
  $text: { $search: string };
}

export interface EventFindFeaturedQuery {
  isFeatured: boolean;
  status: EventStatus;
  isActive: boolean;
  startDate: { $gte: Date };
}

export interface EventFindOneQuery {
  _id: Types.ObjectId;
  isActive: boolean;
  organizerId?: Types.ObjectId;
}

export interface EventFindBySlugQuery {
  slug: string;
  isActive: boolean;
  status: EventStatus;
}

@Schema({ timestamps: true })
export class Event {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: {
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
  })
  location: EventLocation;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  organizerId: Types.ObjectId;

  @Prop({
    type: String,
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ default: 0, min: 0 })
  currentAttendees: number;

  @Prop({
    type: {
      type: String,
      required: true,
      enum: PricingType,
    },
    currency: { type: String, required: true },
    price: { type: Number, required: true },
  })
  pricing: EventPricing;

  @Prop({ trim: true })
  metaTitle: string;

  @Prop({ trim: true })
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);
export type EventDocument = Event & Document;

EventSchema.index({ organizerId: 1 });
EventSchema.index({ categoryId: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ endDate: 1 });
EventSchema.index({ isActive: 1 });
EventSchema.index({ isFeatured: 1 });
EventSchema.index({ slug: 1 }, { unique: true });

EventSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

EventSchema.index({ status: 1, isActive: 1, startDate: 1 });
EventSchema.index({ organizerId: 1, isActive: 1 });
EventSchema.index({ categoryId: 1, status: 1, isActive: 1 });
