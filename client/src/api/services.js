import api from './axios';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Resumes
export const uploadResume = (formData) =>
  api.post('/resumes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getResumes = (params) => api.get('/resumes', { params });
export const getResume = (id) => api.get(`/resumes/${id}`);
export const deleteResume = (id) => api.delete(`/resumes/${id}`);
export const getResumeFile = (id) => api.get(`/resumes/${id}/file`, { responseType: 'blob' });

// Jobs
export const createJob = (data) => api.post('/jobs', data);
export const getJobs = (params) => api.get('/jobs', { params });
export const getJob = (id) => api.get(`/jobs/${id}`);
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

// Evaluations
export const createEvaluation = (data) => api.post('/evaluations', data);
export const getEvaluations = (params) => api.get('/evaluations', { params });
export const getEvaluation = (id) => api.get(`/evaluations/${id}`);
export const deleteEvaluation = (id) => api.delete(`/evaluations/${id}`);
export const resumeBattle = (data) => api.post('/evaluations/battle', data);
export const getDashboardStats = () => api.get('/evaluations/stats/dashboard');
