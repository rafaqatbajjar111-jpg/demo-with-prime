import axios from 'axios';

// This is a simplified version of the SDK used in the provided code
// It targets the base44.app API which seems to be the backend for this app

const APP_ID = "69566252245dc1ecd94d17a4";
const SERVER_URL = "https://base44.app";

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Id': APP_ID
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('base44_access_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ke = {
  auth: {
    me: () => api.get(`/apps/${APP_ID}/entities/User/me`).then(res => res.data),
    updateMe: (data: any) => api.put(`/apps/${APP_ID}/entities/User/me`, data).then(res => res.data),
    logout: (redirectUrl?: string) => {
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
      if (redirectUrl) window.location.href = redirectUrl;
      else window.location.reload();
    },
    redirectToLogin: (fromUrl: string) => {
      window.location.href = `${SERVER_URL}/login?app_id=${APP_ID}&from_url=${encodeURIComponent(fromUrl)}`;
    }
  },
  entities: {
    User: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/User`, { params: { sort, limit } }).then(res => res.data),
      get: (id: string) => api.get(`/apps/${APP_ID}/entities/User/${id}`).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/User/${id}`, data).then(res => res.data),
    },
    SecurityDeposit: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/SecurityDeposit`, { params: { sort, limit } }).then(res => res.data),
      filter: (q: any) => api.get(`/apps/${APP_ID}/entities/SecurityDeposit`, { params: { q: JSON.stringify(q) } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/SecurityDeposit`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/SecurityDeposit/${id}`, data).then(res => res.data),
    },
    Withdrawal: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/Withdrawal`, { params: { sort, limit } }).then(res => res.data),
      filter: (q: any) => api.get(`/apps/${APP_ID}/entities/Withdrawal`, { params: { q: JSON.stringify(q) } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/Withdrawal`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/Withdrawal/${id}`, data).then(res => res.data),
    },
    BankAccount: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/BankAccount`, { params: { sort, limit } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/BankAccount`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/BankAccount/${id}`, data).then(res => res.data),
      delete: (id: string) => api.delete(`/apps/${APP_ID}/entities/BankAccount/${id}`).then(res => res.data),
    },
    AccountActivationRequest: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/AccountActivationRequest`, { params: { sort, limit } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/AccountActivationRequest`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/AccountActivationRequest/${id}`, data).then(res => res.data),
    },
    LiveDeposit: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/LiveDeposit`, { params: { sort, limit } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/LiveDeposit`, data).then(res => res.data),
    },
    Notification: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/Notification`, { params: { sort, limit } }).then(res => res.data),
      filter: (q: any) => api.get(`/apps/${APP_ID}/entities/Notification`, { params: { q: JSON.stringify(q) } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/Notification`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/Notification/${id}`, data).then(res => res.data),
    },
    SupportTicket: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/SupportTicket`, { params: { sort, limit } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/SupportTicket`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/SupportTicket/${id}`, data).then(res => res.data),
    },
    ActivityLog: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/ActivityLog`, { params: { sort, limit } }).then(res => res.data),
    },
    UserActivity: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/UserActivity`, { params: { sort, limit } }).then(res => res.data),
      filter: (q: any, sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/UserActivity`, { params: { q: JSON.stringify(q), sort, limit } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/UserActivity`, data).then(res => res.data),
    },
    BalanceTransaction: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/BalanceTransaction`, { params: { sort, limit } }).then(res => res.data),
      filter: (q: any, sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/BalanceTransaction`, { params: { q: JSON.stringify(q), sort, limit } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/BalanceTransaction`, data).then(res => res.data),
    },
    SiteSettings: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/SiteSettings`, { params: { sort, limit } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/SiteSettings`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/SiteSettings/${id}`, data).then(res => res.data),
    },
    Permission: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/Permission`, { params: { sort, limit } }).then(res => res.data),
      filter: (q: any) => api.get(`/apps/${APP_ID}/entities/Permission`, { params: { q: JSON.stringify(q) } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/Permission`, data).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/Permission/${id}`, data).then(res => res.data),
    },
    Referral: {
      list: (sort?: string, limit?: number) => api.get(`/apps/${APP_ID}/entities/Referral`, { params: { sort, limit } }).then(res => res.data),
      update: (id: string, data: any) => api.put(`/apps/${APP_ID}/entities/Referral/${id}`, data).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/Referral`, data).then(res => res.data),
    },
    ScheduledReport: {
      list: (sort?: string) => api.get(`/apps/${APP_ID}/entities/ScheduledReport`, { params: { sort } }).then(res => res.data),
      create: (data: any) => api.post(`/apps/${APP_ID}/entities/ScheduledReport`, data).then(res => res.data),
      delete: (id: string) => api.delete(`/apps/${APP_ID}/entities/ScheduledReport/${id}`).then(res => res.data),
    }
  },
  integrations: {
    Core: {
      InvokeLLM: (data: any) => api.post(`/apps/${APP_ID}/integration-endpoints/Core/InvokeLLM`, data).then(res => res.data),
      SendEmail: (data: any) => api.post(`/apps/${APP_ID}/integration-endpoints/Core/SendEmail`, data).then(res => res.data),
      UploadFile: (data: any) => {
        const formData = new FormData();
        formData.append('file', data.file);
        return api.post(`/apps/${APP_ID}/integration-endpoints/Core/UploadFile`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
      }
    }
  },
  appLogs: {
    logUserInApp: (page: string) => api.post(`/app-logs/${APP_ID}/log-user-in-app/${page}`).then(res => res.data)
  }
};
