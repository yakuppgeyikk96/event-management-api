import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private i18n: I18nService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      const errorMessage = this.i18n.t('users.errors.emailAlreadyExists');
      throw new ConflictException(errorMessage);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(id),
      isActive: true,
    });

    if (!user) {
      const errorMessage = this.i18n.t('users.errors.userNotFound');
      throw new NotFoundException(errorMessage);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email, isActive: true }).exec();

    if (!user) {
      const errorMessage = this.i18n.t('users.errors.userNotFound');
      throw new NotFoundException(errorMessage);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        const errorMessage = this.i18n.t('users.errors.emailAlreadyExists');
        throw new ConflictException(errorMessage);
      }
    }

    // If password is being updated, hash it
    // if (updateUserDto.password) {
    //   updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    // }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    );

    if (!updatedUser) {
      const errorMessage = this.i18n.t('users.errors.userNotFound');
      throw new NotFoundException(errorMessage);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    await this.findOne(id);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!updatedUser) {
      const errorMessage = this.i18n.t('users.errors.userNotFound');
      throw new NotFoundException(errorMessage);
    }

    return updatedUser;
  }
}
