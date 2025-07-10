import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
}

@Schema({ timestamps: true })
export class User {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null })
  emailVerificationToken?: string;

  @Prop({ default: null })
  passwordResetToken?: string;

  @Prop({ default: null })
  passwordResetExpires?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
