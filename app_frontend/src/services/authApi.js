import { api } from './api.js';

export const verifyEmail = async (data) => {
    const response = await api.post('/user/api/verify-email', data);
    return response.data;
};

export const verifyOtp = async (data) => {
    const response = await api.post('/user/api/verify-otp', data);
    return response.data;
};

export const createAccount = async (data) => {
    const response = await api.post('/user/api/set-password', data);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await api.post('/user/api/login', data);
    return response.data;
};

export const getProfile = async () => {
    const response = await api.post('/user/api/profile');
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.get('/user/api/logout');
    return response.data;
};