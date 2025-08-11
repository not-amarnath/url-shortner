
export interface DemoResponse {
  message: string;
}

export interface ShortenUrlRequest {
  originalUrl: string;
}

export interface ShortenUrlResponse {
  shortCode: string;
}

export interface ErrorResponse {
  error: string;
}
