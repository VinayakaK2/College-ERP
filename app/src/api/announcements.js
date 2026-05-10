import client from './client';

export const announcementApi = {
  getAnnouncements: (params) => client.get('/announcements', params),
  createAnnouncement: (data) => client.post('/announcements', data),
  getAnnouncement: (id) => client.get(`/announcements/${id}`),
  deleteAnnouncement: (id) => client.delete(`/announcements/${id}`),
};
