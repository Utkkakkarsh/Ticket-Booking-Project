import api from './api';

export const getEvents = (params) => api.get('/events', { params }).then(res => res.data);
export const getEvent = (id) => api.get(`/events/${id}`).then(res => res.data);
export const createEvent = (data) => api.post('/events', data).then(res => res.data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data).then(res => res.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`).then(res => res.data);
export const getEventBookings = (id) => api.get(`/events/${id}/bookings`).then(res => res.data);
export const getEventStats = (id) => api.get(`/events/${id}/stats`).then(res => res.data);
