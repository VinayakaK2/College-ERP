import client from './client';

export const teacherApi = {
  getDashboard: () => client.get('/teachers/dashboard'),
  getStudents: (params) => client.get('/teachers/students', params),
  getSubjects: () => client.get('/teachers/subjects'),
  createMark: (data) => client.post('/teachers/marks', data),
  getMyMarks: (params) => client.get('/teachers/marks', params),
  markAttendance: (data) => client.post('/teachers/attendance', data),
  getMyAttendance: (params) => client.get('/teachers/attendance-records', params),
};
