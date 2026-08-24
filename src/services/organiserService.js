import api from './api';

export const getMyEvents = () => api.get('/organiser/events').then(res => res.data);
export const getDashboardStats = () => api.get('/organiser/dashboard').then(res => res.data);
