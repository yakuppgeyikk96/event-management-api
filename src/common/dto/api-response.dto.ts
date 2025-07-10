export class ApiResponse<T> {
  data: T | null;
  message: string;
  success: boolean;
  timestamp: string;

  constructor(
    data: T | null,
    message: string = 'Success',
    success: boolean = true,
  ) {
    this.data = data;
    this.message = message;
    this.success = success;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(data, message, true);
  }

  static error<T>(message: string, data: T | null = null): ApiResponse<T> {
    return new ApiResponse(data, message, false);
  }
}
