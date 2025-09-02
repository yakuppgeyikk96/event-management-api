import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventSearchDto } from './dto/event-search.dto';
import { UpdateEventStatusDto } from './dto/event-status.dto';
import { ApiResponse } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import {
  EventMapper,
  PopulatedEventDocument,
} from '../common/utils/event-mapper.util';
import { I18nService } from 'nestjs-i18n';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  async findAllPublic(
    @Query() searchDto: EventSearchDto,
  ): Promise<ApiResponse<{ events: EventResponseDto[]; total: number }>> {
    const result = await this.eventsService.findAllPublic(searchDto);

    const message = this.i18n.t('events.messages.publicEventsRetrieved');
    return ApiResponse.success(result, message);
  }

  @Get('featured')
  async findFeatured(): Promise<ApiResponse<EventResponseDto[]>> {
    const events = await this.eventsService.findFeatured();

    const message = this.i18n.t('events.messages.featuredEventsRetrieved');
    return ApiResponse.success(events, message);
  }

  @Get('search')
  async searchEvents(
    @Query('q') searchTerm: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<EventResponseDto[]>> {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const events = await this.eventsService.searchEvents(
      searchTerm,
      undefined,
      limitNumber,
    );

    const message = this.i18n.t('events.messages.searchCompleted');
    return ApiResponse.success(events, message);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-events')
  async findAllByOrganizer(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<EventResponseDto[]>> {
    const events = await this.eventsService.findAllByOrganizer(req.user._id);

    const message = this.i18n.t('events.messages.organizerEventsRetrieved');
    return ApiResponse.success(events, message);
  }

  @Get(':slug')
  async findOneBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<EventResponseDto>> {
    const event = await this.eventsService.findOneBySlug(slug);

    const message = this.i18n.t('events.messages.eventRetrieved');
    return ApiResponse.success(event, message);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<EventResponseDto>> {
    const event = await this.eventsService.create(createEventDto, req.user._id);

    const message = this.i18n.t('events.messages.created');
    return ApiResponse.success(
      EventMapper.toResponseDto(event as unknown as PopulatedEventDocument),
      message,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('organizer/search')
  async searchOrganizerEvents(
    @Request() req: AuthenticatedRequest,
    @Query('q') searchTerm: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<EventResponseDto[]>> {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const events = await this.eventsService.searchEvents(
      searchTerm,
      req.user._id,
      limitNumber,
    );

    const message = this.i18n.t('events.messages.organizerSearchCompleted');
    return ApiResponse.success(events, message);
  }

  @UseGuards(JwtAuthGuard)
  @Get('organizer/:id')
  async findOneByOrganizer(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<EventResponseDto>> {
    const event = await this.eventsService.findOne(id, req.user._id);

    const message = this.i18n.t('events.messages.eventRetrieved');
    return ApiResponse.success(
      EventMapper.toResponseDto(event as unknown as PopulatedEventDocument),
      message,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<EventResponseDto>> {
    const event = await this.eventsService.update(
      id,
      updateEventDto,
      req.user._id,
    );

    const message = this.i18n.t('events.messages.updated');
    return ApiResponse.success(
      EventMapper.toResponseDto(event as unknown as PopulatedEventDocument),
      message,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateEventStatusDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<EventResponseDto>> {
    const event = await this.eventsService.updateStatus(
      id,
      updateStatusDto.status,
      req.user._id,
    );

    const message = this.i18n.t('events.messages.statusUpdated');
    return ApiResponse.success(
      EventMapper.toResponseDto(event as unknown as PopulatedEventDocument),
      message,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<null>> {
    await this.eventsService.remove(id, req.user._id);

    const message = this.i18n.t('events.messages.deleted');
    return ApiResponse.success(null, message);
  }
}
