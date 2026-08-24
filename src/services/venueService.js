import api from './api';

export const getVenues = () => api.get('/venues').then(res => res.data);
export const getVenue = (id) => api.get(`/venues/${id}`).then(res => res.data);
export const createVenue = (data) => api.post('/venues', data).then(res => res.data);
export const updateVenue = (id, data) => api.put(`/venues/${id}`, data).then(res => res.data);
export const deleteVenue = (id) => api.delete(`/venues/${id}`).then(res => res.data);
