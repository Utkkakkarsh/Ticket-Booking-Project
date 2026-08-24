import api from './api';

export const joinWaitlist = (eventId, category) => api.post('/waitlist', { eventId, category }).then(res => res.data);
export const getMyWaitlist = () => api.get('/waitlist').then(res => res.data);
export const acceptOffer = (id) => api.post(`/waitlist/${id}/accept`).then(res => res.data);
export const cancelWaitlist = (id) => api.post(`/waitlist/${id}/cancel`).then(res => res.data);
