import client from './client';

export const classApi = {
  getClasses: () => client.get('/classes'),
  getClass: (id) => client.get(`/classes/${id}`),
  createClass: (data) => client.post('/classes', data),
  deleteClass: (id) => client.delete(`/classes/${id}`),
  getSections: (classId) => client.get(`/classes/${classId}/sections`),
  createSection: (data) => client.post('/classes/sections', data),
  getStudents: (classId, sectionId) => client.get(`/classes/${classId}/students`, { sectionId }),
};
