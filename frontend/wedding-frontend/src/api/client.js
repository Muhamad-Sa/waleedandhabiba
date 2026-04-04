import axios from "axios";

const api = axios.create({
    baseURL: "https://waleedandhabiba-backend.vercel.app",
});

export default api;