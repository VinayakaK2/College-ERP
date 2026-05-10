import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  verifyOtp: (email, otp) => client.post('/auth/verify-otp', { email, otp }),
  parentLogin: (studentId, phone) => client.post('/auth/parent-login', { studentId, phone }),
  parentVerifyOtp: (studentId, phone, otp) => client.post('/auth/parent-verify-otp', { studentId, phone, otp }),
  getMe: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout', {}),
};
