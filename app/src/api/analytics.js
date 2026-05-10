import client from './client';

export const analyticsApi = {
  getDashboardAnalytics: () => client.get('/analytics/dashboard'),
  getClassAnalytics: (classId) => client.get(`/analytics/class/${classId}`),
  getStudentAnalytics: (studentId) => client.get(`/analytics/student/${studentId}`),
  getAttendanceAnalytics: (params) => client.get('/analytics/attendance', params),
  getFeesAnalytics: () => client.get('/analytics/fees'),
};
