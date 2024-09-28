import axios from 'axios';
import Session from 'supertokens-auth-react/recipe/session';

const instance = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

instance.interceptors.request.use(async (config) => {
  const accessToken = await Session.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default instance;