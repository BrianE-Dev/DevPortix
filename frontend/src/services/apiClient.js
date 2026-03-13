const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';

const parseError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.message || 'Request failed';
  } catch (_error) {
    return 'Request failed';
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
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
