import axios from "axios";
import { BACKEND_URL } from "../config/env";
// import toast from "react-hot-toast";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let redirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};
    const isLoginPage = window.location.pathname === "/login";

    if (status === 401 && !redirecting && !isLoginPage) {
      redirecting = true;

      // toast.error("Token expired.", {
      //   duration: 2000,
      //   position: "top-center",
      // });

      window.location.href = "/login";
      // setTimeout(() => {
      //   window.location.href = "/login";
      // }, 1500);
    }

    return Promise.reject(error);
  }
);

export default api;
