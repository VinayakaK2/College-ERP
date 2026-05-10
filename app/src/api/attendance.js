import client from './client';

export const attendanceApi = {
  getAttendance: (params) => client.get('/attendance', params),
  getSummary: (params) => client.get('/attendance/summary', params),
  markAttendance: (data) => client.post('/attendance', data),
  updateAttendance: (id, data) => client.put(`/attendance/${id}`, data),
  getStudentAttendance: (studentId, params) => client.get(`/attendance/student/${studentId}`, params),
};
