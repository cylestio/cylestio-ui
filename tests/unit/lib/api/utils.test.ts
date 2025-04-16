import { formatRequestParams, extractErrorMessage, parseErrorDetails } from '@/lib/api/utils';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/lib/api/client';

describe('API Utils', () => {
  describe('formatRequestParams', () => {
    test('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const params = {
        startDate: date,
        endDate: date,
        name: 'Test',
      };

      const formatted = formatRequestParams(params);
      
      expect(formatted).toEqual({
        startDate: date.toISOString(),
        endDate: date.toISOString(),
        name: 'Test',
      });
    });

    test('should skip null and undefined values', () => {
      const params = {
        name: 'Test',
        age: null,
        email: undefined,
        active: true,
      };

      const formatted = formatRequestParams(params);
      
      expect(formatted).toEqual({
        name: 'Test',
        active: true,
      });
    });

    test('should handle empty objects', () => {
      const formatted = formatRequestParams({});
      expect(formatted).toEqual({});
    });
  });

  describe('extractErrorMessage', () => {
    test('should extract message from error response', () => {
      const axiosError = {
        response: {
          data: {
            status: 'error',
            message: 'Invalid input',
          },
        },
        message: 'Request failed with status code 400',
      } as unknown as AxiosError<ApiErrorResponse>;

      const message = extractErrorMessage(axiosError);
      expect(message).toBe('Invalid input');
    });

    test('should extract field errors if available and there is no message', () => {
      const axiosError = {
        response: {
          data: {
            status: 'error',
            detail: {
              errors: [
                { field: 'username', message: 'Too short', type: 'validation' },
                { field: 'password', message: 'Too weak', type: 'validation' },
              ]
            }
          },
        },
        message: 'Request failed with status code 400',
      } as unknown as AxiosError<ApiErrorResponse>;

      const message = extractErrorMessage(axiosError);
      expect(message).toBe('username: Too short, password: Too weak');
    });

    test('should handle network errors', () => {
      const axiosError = {
        message: 'Network Error',
      } as unknown as AxiosError<ApiErrorResponse>;

      const message = extractErrorMessage(axiosError);
      expect(message).toBe('Network Error');
    });

    test('should return default message for unexpected errors', () => {
      const axiosError = {
        response: {
          data: {},
        },
      } as unknown as AxiosError<ApiErrorResponse>;

      const message = extractErrorMessage(axiosError);
      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('parseErrorDetails', () => {
    test('should parse client errors correctly', () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            status: 'error',
            message: 'Bad request',
            detail: {
              errors: [
                { field: 'id', message: 'Invalid ID', type: 'validation' }
              ]
            }
          },
        },
        message: 'Request failed',
      } as unknown as AxiosError<ApiErrorResponse>;

      const details = parseErrorDetails(axiosError);
      
      expect(details).toEqual({
        message: 'Bad request',
        statusCode: 400,
        fieldErrors: [{ field: 'id', message: 'Invalid ID', type: 'validation' }],
        isNetworkError: false,
        isClientError: true,
        isServerError: false
      });
    });

    test('should parse server errors correctly', () => {
      const axiosError = {
        response: {
          status: 500,
          data: {
            status: 'error',
            message: 'Internal server error',
          },
        },
        message: 'Request failed',
      } as unknown as AxiosError<ApiErrorResponse>;

      const details = parseErrorDetails(axiosError);
      
      expect(details).toEqual({
        message: 'Internal server error',
        statusCode: 500,
        fieldErrors: [],
        isNetworkError: false,
        isClientError: false,
        isServerError: true
      });
    });

    test('should parse network errors correctly', () => {
      const axiosError = {
        message: 'Network Error',
      } as unknown as AxiosError<ApiErrorResponse>;

      const details = parseErrorDetails(axiosError);
      
      expect(details).toEqual({
        message: 'Network Error',
        statusCode: undefined,
        fieldErrors: [],
        isNetworkError: true,
        isClientError: false,
        isServerError: false
      });
    });
  });
}); 