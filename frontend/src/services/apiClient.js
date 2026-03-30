import { resolveApiUrl } from '../utils/api';

const parseError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.message || 'Request failed';
  } catch (_error) {
    try {
      const text = await response.text();
      return text || 'Request failed';
    } catch (_nestedError) {
      return 'Request failed';
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
    const message = await parseError(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
};
