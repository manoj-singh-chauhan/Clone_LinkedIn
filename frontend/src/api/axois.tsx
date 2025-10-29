import axios from "axios";
import { BACKEND_URL } from "../config/env";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let redirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};   //error.response we get status code and if no response then empty object
    const isLoginPage = window.location.pathname === "/login";

    if (status === 401 && !redirecting && !isLoginPage) {
      redirecting = true;

      // alert("Session expired");
      // console.log("Session expired");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;