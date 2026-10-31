// Client API Service Helper
const API_BASE = '/api';

export const getHeaders = () => {
  const token = localStorage.getItem('tahfeez_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'حدث خطأ في الخادم');
    return data;
  },

  post: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'حدث خطأ في الخادم');
    return data;
  },

  put: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'حدث خطأ في الخادم');
    return data;
  },

  patch: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'حدث خطأ في الخادم');
    return data;
  },

  delete: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'حدث خطأ في الخادم');
    return data;
  },

  // Safe authenticated download helper for Excel/PDF exports
  downloadBlob: async (endpoint, fallbackFilename = 'download') => {
    const token = localStorage.getItem('tahfeez_token');
    const separator = endpoint.includes('?') ? '&' : '?';
    const authUrl = `${API_BASE}${endpoint}${token ? `${separator}token=${encodeURIComponent(token)}` : ''}`;

    const res = await fetch(authUrl, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!res.ok) {
      let errText = 'فشل تنزيل الملف';
      try {
        const errJson = await res.json();
        errText = errJson.message || errText;
      } catch (e) {
        // ignore
      }
      throw new Error(errText);
    }

    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = fallbackFilename;
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      try {
        filename = decodeURIComponent(filenameMatch[1]);
      } catch (e) {
        filename = filenameMatch[1];
      }
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    return true;
  }
};
