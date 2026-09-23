import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

export const loginAPI = async (username: string, password: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      {
        username,
        password,
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error during login:", error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "Login failed";
      toast.error(errorMessage);
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }
};
export const logoutAPI = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/logout`,
      {}, // this caused a problem of not sending the cookie to the server
      // so we need to send an empty object as the body
      {
        withCredentials: true,
      }
    );
    toast.success("Logged out successfully");
    return response.data;
  } catch (error) {
    console.error("Error during logout:", error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "Logout failed";
      toast.error(errorMessage);
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }
};

export const signupAPI = async (userData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/signup`,
      {
        fullName: userData.fullName,
        username: userData.username,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        gender: userData.gender,
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error during signup:", error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || "Signup failed";
      toast.error(errorMessage);
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/auth/me`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch user";
      toast.error(errorMessage);
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }
};
