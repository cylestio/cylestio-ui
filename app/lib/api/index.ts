import apiClient, { API_BASE_URL, API_TIMEOUT } from './client';
import type { ApiErrorResponse } from './client';
import { formatRequestParams, extractErrorMessage, parseErrorDetails } from './utils';
import * as apiServices from './services';

export {
  apiClient as default,
  API_BASE_URL,
  API_TIMEOUT,
  formatRequestParams,
  extractErrorMessage,
  parseErrorDetails,
  apiServices
};

export type { ApiErrorResponse }; 