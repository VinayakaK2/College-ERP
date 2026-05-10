import client from './client';

export const adminApi = {
  getDashboard: () => client.get('/admin/dashboard'),
  getTeachers: (params) => client.get('/admin/teachers', params),
  createTeacher: (data) => client.post('/admin/teachers', data),
  updateTeacher: (id, data) => client.put(`/admin/teachers/${id}`, data),
  deleteTeacher: (id) => client.delete(`/admin/teachers/${id}`),
  getSubjects: () => client.get('/admin/subjects'),
  createSubject: (data) => client.post('/admin/subjects', data),
  getAuditLogs: (params) => client.get('/admin/audit-logs', params),
};
