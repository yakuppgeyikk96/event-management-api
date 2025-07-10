import { Event } from '../../events/entities/event.entity';
import { EventResponseDto } from '../../events/dto/event-response.dto';

export interface PopulatedEventDocument
  extends Omit<Event, 'categoryId' | 'organizerId'> {
  categoryId: {
    _id: string;
    name: string;
    type: string;
  };
  organizerId: {
    _id: string;
    name: string;
    email: string;
  };
}

export class EventMapper {
  static toResponseDto(event: PopulatedEventDocument): EventResponseDto {
    return {
      _id: event._id?.toString() ?? '',
      title: event.title,
      description: event.description,
      slug: event.slug,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      category: {
        _id: event.categoryId._id.toString(),
        name: event.categoryId.name,
        type: event.categoryId.type,
      },
      organizer: {
        _id: event.organizerId._id.toString(),
        name: event.organizerId.name,
        email: event.organizerId.email,
      },
      status: event.status,
      capacity: event.capacity,
      currentAttendees: event.currentAttendees,
      pricing: event.pricing,
      metaTitle: event.metaTitle,
      metaDescription: event.metaDescription,
      tags: event.tags,
      isActive: event.isActive,
      isFeatured: event.isFeatured,
      createdAt: event.createdAt ?? new Date(),
      updatedAt: event.updatedAt ?? new Date(),
    };
  }

  static toResponseDtoList(
    events: PopulatedEventDocument[],
  ): EventResponseDto[] {
    return events.map((event) => this.toResponseDto(event));
  }
}
