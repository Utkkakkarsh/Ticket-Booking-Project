import api from './api';

export const createBooking = (eventId, seatLabels) => api.post('/bookings', { eventId, seatLabels }).then(res => res.data);
export const getMyBookings = () => api.get('/bookings').then(res => res.data);
export const getBooking = (id) => api.get(`/bookings/${id}`).then(res => res.data);
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel`).then(res => res.data);
export const getAllBookings = () => api.get('/bookings/admin/all').then(res => res.data);
