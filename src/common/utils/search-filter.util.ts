import { Types } from 'mongoose';
import { BaseSearchOptions } from '../interfaces/base-search.interface';

export interface SearchFilterConfig {
  textFields?: string[];
  exactFields?: string[];
  dateFields?: string[];
  numberFields?: string[];
  objectIdFields?: string[];
  nestedFields?: Record<string, string>;
  defaultSort?: { field: string; order: 1 | -1 };
}

export class SearchFilterUtil {
  static addSearchFilters(
    query: Record<string, any>,
    searchOptions: BaseSearchOptions,
    config: SearchFilterConfig,
  ): void {
    if (searchOptions.q?.trim()) {
      this.addTextSearch(query, searchOptions.q, config);
    }

    this.addCustomFilters(query, searchOptions, config);
  }

  static buildSortQuery(
    searchOptions: BaseSearchOptions,
    config: SearchFilterConfig,
  ): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};

    if (searchOptions.sortBy) {
      const sortField = this.mapSortField(searchOptions.sortBy);
      sort[sortField] = searchOptions.sortOrder === 'desc' ? -1 : 1;
    } else if (config.defaultSort) {
      sort[config.defaultSort.field] = config.defaultSort.order;
    }

    return sort;
  }

  static buildPaginationQuery(searchOptions: BaseSearchOptions): {
    limit: number;
    skip: number;
  } {
    const limit = searchOptions.limit || 10;
    const page = searchOptions.page || 0;
    return { limit, skip: page * limit };
  }

  private static addTextSearch(
    query: Record<string, any>,
    searchTerm: string,
    config: SearchFilterConfig,
  ): void {
    if (config.textFields && config.textFields.length > 0) {
      query.$text = { $search: searchTerm };
    } else {
      const textConditions =
        config.textFields?.map((field) => ({
          [field]: { $regex: searchTerm, $options: 'i' },
        })) || [];

      if (textConditions.length > 0) {
        query.$or = textConditions;
      }
    }
  }

  private static addCustomFilters(
    query: Record<string, any>,
    searchOptions: BaseSearchOptions,
    config: SearchFilterConfig,
  ): void {
    Object.entries(searchOptions).forEach(([key, value]) => {
      if (
        value === undefined ||
        key === 'q' ||
        key === 'sortBy' ||
        key === 'sortOrder' ||
        key === 'page' ||
        key === 'limit' ||
        key === 'lang'
      ) {
        return;
      }

      this.addFilterByType(query, key, value, config);
    });
  }

  private static addFilterByType(
    query: Record<string, any>,
    field: string,
    value: string | number | boolean,
    config: SearchFilterConfig,
  ): void {
    if (config.objectIdFields?.includes(field)) {
      query[field] = new Types.ObjectId(String(value));
      return;
    }

    if (config.dateFields?.includes(field)) {
      if (field.includes('start') || field.includes('min')) {
        query[field] = { $gte: new Date(String(value)) };
      } else if (field.includes('end') || field.includes('max')) {
        query[field] = { $lte: new Date(String(value)) };
      } else {
        query[field] = new Date(String(value));
      }
      return;
    }

    if (config.numberFields?.includes(field)) {
      const numValue = typeof value === 'string' ? Number(value) : value;
      if (field.includes('min')) {
        query[field.replace('min', '')] = { $gte: numValue };
      } else if (field.includes('max')) {
        query[field.replace('max', '')] = { $lte: numValue };
      } else {
        query[field] = numValue;
      }
      return;
    }

    if (config.nestedFields && config.nestedFields[field]) {
      if (typeof value === 'string') {
        query[config.nestedFields[field]] = { $regex: value, $options: 'i' };
      } else {
        query[config.nestedFields[field]] = value;
      }
      return;
    }

    if (config.exactFields?.includes(field)) {
      query[field] = value;
      return;
    }

    if (typeof value === 'string') {
      query[field] = { $regex: value, $options: 'i' };
    } else {
      query[field] = value;
    }
  }

  private static mapSortField(sortBy: string): string {
    const fieldMappings: Record<string, string> = {
      startDate: 'startDate',
      endDate: 'endDate',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      title: 'title',
      name: 'name',
      price: 'pricing.price',
    };

    return fieldMappings[sortBy] || sortBy;
  }
}
