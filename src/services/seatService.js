import api from './api';

export const getSeats = (eventId) => api.get(`/seats/event/${eventId}`).then(res => res.data);
export const holdSeats = (eventId, seatLabels) => api.post('/seats/hold', { eventId, seatLabels }).then(res => res.data);
export const releaseSeats = (eventId, seatLabels) => api.post('/seats/release', { eventId, seatLabels }).then(res => res.data);
