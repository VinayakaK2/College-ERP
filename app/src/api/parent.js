import client from './client';

export const parentApi = {
  getDashboard: () => client.get('/parents/dashboard'),
  getAttendance: (params) => client.get('/parents/attendance', params),
  getMarks: (params) => client.get('/parents/marks', params),
  getFees: () => client.get('/parents/fees'),
  getAnnouncements: () => client.get('/parents/announcements'),
};
