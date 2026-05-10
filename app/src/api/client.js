const API_BASE = '/api';

const client = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    const url = `${API_BASE}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      const error = new Error(data?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = data?.errorCode;
      throw error;
    }

    return data;
  },

  get(endpoint, params) {
    const queryString = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null)).toString()
      : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default client;
