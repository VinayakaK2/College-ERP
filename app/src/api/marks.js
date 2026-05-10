import client from './client';

export const marksApi = {
  getMarks: (params) => client.get('/marks', params),
  createMark: (data) => client.post('/marks', data),
  getMark: (id) => client.get(`/marks/${id}`),
  updateMark: (id, data) => client.put(`/marks/${id}`, data),
  deleteMark: (id) => client.delete(`/marks/${id}`),
  getStudentMarks: (studentId, params) => client.get(`/marks/student/${studentId}`, params),
  getClassRanking: (classId, params) => client.get(`/marks/ranking/${classId}`, params),
};
