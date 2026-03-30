const EXPLICIT_API_URL = String(import.meta.env.VITE_API_URL || '').trim();

export const getApiOrigin = () => {
  if (EXPLICIT_API_URL && EXPLICIT_API_URL.toLowerCase() !== 'same-origin') {
    return EXPLICIT_API_URL.replace(/\/+$/, '');
  }

  return '';
};

export const resolveApiUrl = (path) => {
  const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`;
  return `${getApiOrigin()}${normalizedPath}`;
};

export const resolveMediaUrl = (url) => {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) return '';
  if (normalizedUrl.startsWith('http') || normalizedUrl.startsWith('data:')) {
    return normalizedUrl;
  }
  return `${getApiOrigin()}${normalizedUrl}`;
};
