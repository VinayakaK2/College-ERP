import client from './client';

export const studentApi = {
  getStudents: (params) => client.get('/students', params),
  getStudent: (id) => client.get(`/students/${id}`),
  createStudent: (data) => client.post('/students', data),
  updateStudent: (id, data) => client.put(`/students/${id}`, data),
  deleteStudent: (id) => client.delete(`/students/${id}`),
  getPerformance: (id) => client.get(`/students/${id}/performance`),
  getAttendance: (id, params) => client.get(`/students/${id}/attendance`, params),
};
