import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// Exportar para uso em fetch direto
export const getApiBaseUrl = () => API_BASE_URL;

// Criar instância do axios com configuração base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (data: any) => 
    api.post('/auth/register', data),
  logout: () => 
    api.post('/auth/logout'),
};

// Dashboard
export const dashboardApi = {
  getInicio: (perfil?: string) => 
    api.get('/dashboard/inicio', { params: { perfil } }),
};

// Eventos
export const eventosApi = {
  list: () => api.get('/eventos'),
  get: (id: string) => api.get(`/eventos/${id}`),
  create: (data: any) => api.post('/eventos', data),
  update: (id: string, data: any) => api.put(`/eventos/${id}`, data),
  delete: (id: string) => api.delete(`/eventos/${id}`),
  getEstatisticas: (id: string) => api.get(`/eventos/${id}/estatisticas`),
  gerarLink: (id: string) => api.post(`/eventos/${id}/gerar-link`),
  associar: (token: string) => api.post(`/eventos/associar/${token}`),
};

// Palestras
export const palestrasApi = {
  create: (data: any) => api.post('/palestras', data),
  get: (id: string) => api.get(`/palestras/${id}`),
  getStatus: (id: string) => api.get(`/palestras/${id}/status`),
};

// Livebooks
export const livebooksApi = {
  list: () => api.get('/livebooks'),
  get: (id: string) => api.get(`/livebooks/${id}`),
  create: (data: any) => api.post('/livebooks', data),
  registrarIntencao: (origem: 'gravar_agora' | 'upload_arquivo' | 'gerar_livebook') => 
    api.post('/livebooks/registrar-intencao', { origem }),
  getOpcoes: (palestraId: string) => api.get(`/livebooks/palestra/${palestraId}/opcoes`),
  getDownloadUrl: (id: string, formato: string) => api.get(`/livebooks/${id}/download/${formato}`),
  getByPalestra: (palestraId: string) => api.get(`/livebooks/palestra/${palestraId}`),
};

// Configurações
export const configuracoesApi = {
  get: () => api.get('/configuracoes'),
  updatePerfil: (data: any) => api.put('/configuracoes/perfil', data),
  updatePreferencias: (data: any) => api.put('/configuracoes/preferencias', data),
  updateNotificacoes: (data: any) => api.put('/configuracoes/notificacoes', data),
  getOrganizador: () => api.get('/configuracoes/organizador'),
  updateOrganizador: (data: any) => api.put('/configuracoes/organizador', data),
};

// Participantes (organizador)
export const participantesApi = {
  list: (eventoId?: string) => api.get('/participantes', { params: { evento_id: eventoId } }),
  getEstatisticas: () => api.get('/participantes/estatisticas'),
};

// Rankings (organizador)
export const rankingsApi = {
  getPalestras: (eventoId?: string, limit?: number) => 
    api.get('/rankings/palestras', { params: { evento_id: eventoId, limit } }),
  getTemas: (eventoId?: string) => 
    api.get('/rankings/temas', { params: { evento_id: eventoId } }),
  getInsights: () => api.get('/rankings/insights'),
};

// Relatórios (organizador)
export const relatoriosApi = {
  getExecutivo: (params?: any) => api.get('/relatorios/executivo', { params }),
  getMetricas: () => api.get('/relatorios/metricas'),
  gerar: (filtros: any) => api.post('/relatorios/gerar', filtros),
};

export default api;

// Notificações
export const notificacoesApi = {
  list: (limit?: number) => api.get('/notificacoes', { params: { limit } }),
  markAsRead: (id: string) => api.put(`/notificacoes/${id}/marcar-lida`),
  markAllAsRead: () => api.put('/notificacoes/marcar-todas-lidas'),
};

// IA (Bia e Tutor)
export const iaApi = {
  iniciar: (tipo_ia: 'bia' | 'tutor') => api.post('/ia/iniciar', { tipo_ia }),
  responder: (interacaoId: string, conteudo: string) => api.post(`/ia/${interacaoId}/responder`, { conteudo }),
  historico: (interacaoId: string) => api.get(`/ia/${interacaoId}/historico`),
};

