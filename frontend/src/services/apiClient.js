import { resolveApiUrl } from '../utils/api';

const parseError = async (response) => {
  try {
    const payload = await response.json();
    return {
      message: payload?.message || 'Request failed',
      payload,
    };
  } catch (_error) {
    try {
      const text = await response.text();
      return {
        message: text || 'Request failed',
        payload: null,
      };
    } catch (_nestedError) {
      return {
        message: 'Request failed',
        payload: null,
      };
    }
  }
};

export const request = async (path, options = {}) => {
  const { headers: customHeaders = {}, ...restOptions } = options;
  const isFormDataBody = typeof FormData !== 'undefined' && restOptions.body instanceof FormData;

  const mergedHeaders = isFormDataBody
    ? {
        ...customHeaders,
      }
    : {
        'Content-Type': 'application/json',
        ...customHeaders,
      };

  const response = await fetch(resolveApiUrl(path), {
    ...restOptions,
    cache: 'no-store',
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const { message, payload } = await parseError(response);
    const retryAfterHeader = Number(response.headers.get('Retry-After'));
    const error = new Error(message);
    error.status = response.status;
    error.retryAfterSeconds =
      payload?.retryAfterSeconds ||
      (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader
        : undefined);
    error.payload = payload;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
};
