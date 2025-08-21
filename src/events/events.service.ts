import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Event,
  EventDocument,
  EventStatus,
  EventFindByOrganizerQuery,
  EventSearchQuery,
  EventFindFeaturedQuery,
  EventFindOneQuery,
  EventFindBySlugQuery,
  EventFindPublicQuery,
} from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventSearchDto } from './dto/event-search.dto';
import { I18nService } from 'nestjs-i18n';
import { generateSlug, generateUniqueSlug } from '../common/utils/slug.util';
import {
  generateMetaTitle,
  generateMetaDescription,
} from '../common/utils/seo.util';
import {
  EventMapper,
  PopulatedEventDocument,
} from '../common/utils/event-mapper.util';
import {
  SearchFilterUtil,
  SearchFilterConfig,
} from '../common/utils/search-filter.util';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private i18n: I18nService,
    private categoriesService: CategoriesService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    organizerId: string,
  ): Promise<Event> {
    this.validateEventDates(createEventDto.startDate, createEventDto.endDate);

    const category = await this.categoriesService.findOneBySlug(
      createEventDto.category,
    );

    const slug = await this.generateUniqueSlug(createEventDto.title);

    const { metaTitle, metaDescription } = this.generateSeoTags(
      createEventDto.title,
      createEventDto.description,
    );

    const event = new this.eventModel({
      ...createEventDto,
      slug,
      categoryId: category._id,
      organizerId: new Types.ObjectId(organizerId),
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
      metaTitle,
      metaDescription,
      pricing: {
        ...createEventDto.pricing,
        currency: createEventDto.pricing.currency || 'TRY',
      },
    });

    return event.save();
  }

  async findAllByOrganizer(organizerId: string): Promise<EventResponseDto[]> {
    const query: EventFindByOrganizerQuery = {
      organizerId: new Types.ObjectId(organizerId),
      isActive: true,
    };

    const events = await this.eventModel
      .find(query)
      .populate('categoryId', 'name type')
      .populate('organizerId', 'name email')
      .sort({ startDate: 1 })
      .exec();

    return EventMapper.toResponseDtoList(
      events as unknown as PopulatedEventDocument[],
    );
  }

  async findAllPublic(
    searchDto: EventSearchDto,
  ): Promise<{ events: EventResponseDto[]; total: number }> {
    const query: EventFindPublicQuery = {
      status: EventStatus.PUBLISHED,
      isActive: true,
      startDate: { $gte: new Date() },
    };

    if (searchDto.category) {
      try {
        const category = await this.categoriesService.findOneBySlug(
          searchDto.category,
        );
        query.categoryId = category._id;
      } catch {
        return { events: [], total: 0 };
      }
    }

    const searchDtoWithoutCategory = { ...searchDto };
    delete searchDtoWithoutCategory.category;

    const searchConfig: SearchFilterConfig = {
      textFields: ['title', 'description', 'tags'],
      exactFields: ['status'],
      dateFields: ['startDate', 'endDate'],
      numberFields: ['minPrice', 'maxPrice'],
      nestedFields: {
        city: 'location.city',
        minPrice: 'pricing.price',
        maxPrice: 'pricing.price',
      },
      defaultSort: { field: 'startDate', order: 1 },
    };

    SearchFilterUtil.addSearchFilters(
      query,
      searchDtoWithoutCategory,
      searchConfig,
    );

    const sort = SearchFilterUtil.buildSortQuery(searchDto, searchConfig);

    const { limit, skip } = SearchFilterUtil.buildPaginationQuery(searchDto);

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query)
        .populate('categoryId', 'name type slug')
        .populate('organizerId', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.eventModel.countDocuments(query),
    ]);

    return {
      events: EventMapper.toResponseDtoList(
        events as unknown as PopulatedEventDocument[],
      ),
      total,
    };
  }

  async searchEvents(
    searchTerm: string,
    organizerId?: string,
    limit: number = 10,
  ): Promise<EventResponseDto[]> {
    if (!searchTerm?.trim()) {
      return [];
    }

    const query: EventSearchQuery = {
      $or: [
        {
          status: EventStatus.PUBLISHED,
          isActive: true,
        },
        ...(organizerId
          ? [
              {
                organizerId: new Types.ObjectId(organizerId),
                isActive: true,
              },
            ]
          : []),
      ],
      $text: { $search: searchTerm },
    };

    const events = await this.eventModel
      .find(query)
      .populate('categoryId', 'name type')
      .populate('organizerId', 'name email')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .exec();

    return EventMapper.toResponseDtoList(
      events as unknown as PopulatedEventDocument[],
    );
  }

  async findOne(id: string, organizerId?: string): Promise<Event> {
    const query: EventFindOneQuery = {
      _id: new Types.ObjectId(id),
      isActive: true,
    };

    if (organizerId) {
      query.organizerId = new Types.ObjectId(organizerId);
    }

    const event = await this.eventModel.findOne(query);

    if (!event) {
      const errorMessage = this.i18n.t('events.errors.eventNotFound');
      throw new NotFoundException(errorMessage);
    }

    return event;
  }

  async findOneBySlug(slug: string): Promise<EventResponseDto> {
    const query: EventFindBySlugQuery = {
      slug,
      isActive: true,
      status: EventStatus.PUBLISHED,
    };

    const event = await this.eventModel
      .findOne(query)
      .populate('categoryId', 'name type')
      .populate('organizerId', 'name email')
      .exec();

    if (!event) {
      const errorMessage = this.i18n.t('events.errors.eventNotFound');
      throw new NotFoundException(errorMessage);
    }

    return EventMapper.toResponseDto(
      event as unknown as PopulatedEventDocument,
    );
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    organizerId: string,
  ): Promise<Event> {
    const event = await this.findOne(id, organizerId);

    if (updateEventDto.startDate || updateEventDto.endDate) {
      this.validateEventDates(
        updateEventDto.startDate || event.startDate,
        updateEventDto.endDate || event.endDate,
      );
    }

    const updateData: Partial<Event> = {};

    if (updateEventDto.description)
      updateData.description = updateEventDto.description;
    if (updateEventDto.startDate)
      updateData.startDate = new Date(updateEventDto.startDate);
    if (updateEventDto.endDate)
      updateData.endDate = new Date(updateEventDto.endDate);
    if (updateEventDto.location) updateData.location = updateEventDto.location;
    if (updateEventDto.capacity) updateData.capacity = updateEventDto.capacity;
    if (updateEventDto.pricing) {
      updateData.pricing = {
        ...updateEventDto.pricing,
        currency: updateEventDto.pricing.currency || 'TRY',
      };
    }
    if (updateEventDto.tags) updateData.tags = updateEventDto.tags;
    if (updateEventDto.isFeatured !== undefined)
      updateData.isFeatured = updateEventDto.isFeatured;

    if (updateEventDto.category) {
      const category = await this.categoriesService.findOneBySlug(
        updateEventDto.category,
      );
      updateData.categoryId = category._id;
    }

    if (updateEventDto.description) {
      const { metaTitle, metaDescription } = this.generateSeoTags(
        event.title,
        updateEventDto.description,
      );
      updateData.metaTitle = metaTitle;
      updateData.metaDescription = metaDescription;
    }

    const updatedEvent = await this.eventModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    if (!updatedEvent) {
      const errorMessage = this.i18n.t('events.errors.eventNotFound');
      throw new NotFoundException(errorMessage);
    }

    return updatedEvent;
  }

  async updateStatus(
    id: string,
    status: EventStatus,
    organizerId: string,
  ): Promise<Event> {
    const event = await this.findOne(id, organizerId);
    this.validateStatusTransition(event.status, status);

    const updatedEvent = await this.eventModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!updatedEvent) {
      const errorMessage = this.i18n.t('events.errors.eventNotFound');
      throw new NotFoundException(errorMessage);
    }

    return updatedEvent;
  }

  async remove(id: string, organizerId: string): Promise<Event> {
    await this.findOne(id, organizerId);

    const updatedEvent = await this.eventModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!updatedEvent) {
      const errorMessage = this.i18n.t('events.errors.eventNotFound');
      throw new NotFoundException(errorMessage);
    }

    return updatedEvent;
  }

  async findFeatured(): Promise<EventResponseDto[]> {
    const query: EventFindFeaturedQuery = {
      isFeatured: true,
      status: EventStatus.PUBLISHED,
      isActive: true,
      startDate: { $gte: new Date() },
    };

    const events = await this.eventModel
      .find(query)
      .populate('categoryId', 'name type')
      .populate('organizerId', 'name email')
      .sort({ startDate: 1 })
      .limit(6)
      .exec();

    return EventMapper.toResponseDtoList(
      events as unknown as PopulatedEventDocument[],
    );
  }

  private validateEventDates(
    startDate: Date | string,
    endDate: Date | string,
  ): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      const errorMessage = this.i18n.t(
        'events.errors.endDateMustBeAfterStartDate',
      );
      throw new BadRequestException(errorMessage);
    }

    if (start <= new Date()) {
      const errorMessage = this.i18n.t('events.errors.startDateMustBeInFuture');
      throw new BadRequestException(errorMessage);
    }
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = generateSlug(title);
    const existingSlugs = await this.eventModel
      .find({}, { slug: 1 })
      .lean()
      .exec();
    const existingSlugValues = existingSlugs.map((e) => e.slug);
    return generateUniqueSlug(baseSlug, existingSlugValues);
  }

  private generateSeoTags(
    title: string,
    description: string,
  ): {
    metaTitle: string;
    metaDescription: string;
  } {
    return {
      metaTitle: generateMetaTitle(title),
      metaDescription: generateMetaDescription(description),
    };
  }

  private validateStatusTransition(
    currentStatus: EventStatus,
    newStatus: EventStatus,
  ): void {
    if (
      currentStatus === EventStatus.COMPLETED &&
      newStatus !== EventStatus.COMPLETED
    ) {
      const errorMessage = this.i18n.t(
        'events.errors.cannotChangeCompletedEvent',
      );
      throw new BadRequestException(errorMessage);
    }

    if (
      currentStatus === EventStatus.CANCELLED &&
      newStatus !== EventStatus.CANCELLED
    ) {
      const errorMessage = this.i18n.t(
        'events.errors.cannotChangeCancelledEvent',
      );
      throw new BadRequestException(errorMessage);
    }
  }
}
