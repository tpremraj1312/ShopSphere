const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '');

export const API_BASE_URL = normalizedApiUrl.endsWith('/api/v1')
	? normalizedApiUrl
	: `${normalizedApiUrl}/api/v1`;
