import { api } from './api.js';

export const sendOtp = async (data) => {
    const response = await api.post('/user/api/send-otp', data);
    return response.data;
};

export const verifyOtp = async (data) => {
    const response = await api.post('/user/api/verify-otp', data);
    return response.data;
};

export const signupUser = async (userData) => {
    const response = await api.post('/user/api/signupEmail', userData);
    console.log(response.data);
    return response.data;
};

export const createAccount = async (passwordData) => {
    const response = await api.post('/user/api/signupPassword', passwordData);
    return response.data;
};