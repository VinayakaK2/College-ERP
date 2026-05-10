import client from './client';

export const feesApi = {
  getFees: (params) => client.get('/fees', params),
  createFee: (data) => client.post('/fees', data),
  getFee: (id) => client.get(`/fees/${id}`),
  updateFee: (id, data) => client.put(`/fees/${id}`, data),
  recordPayment: (id, data) => client.post(`/fees/${id}/payment`, data),
  getStudentFees: (studentId) => client.get(`/fees/student/${studentId}`),
};
