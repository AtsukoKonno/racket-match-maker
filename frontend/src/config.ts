// API URL configuration
// In development, Vite proxy handles /api requests
// In production, use the environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
