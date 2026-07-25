import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AuthUser {
  fullName: string;
  username: string;
  profilePicture: string;
  role: string;
  id: string;
}
interface AuthContextType {
  authUser: AuthUser | null;
  setAuthUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  isLoading: boolean;
  isAuthenticated: boolean;
}
export const AuthContext = createContext<AuthContextType>({
  authUser: null,
  setAuthUser: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export const AuthContextProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            withCredentials: true,
          },
        );
        setAuthUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setAuthUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ authUser, setAuthUser, isAuthenticated, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  return useContext(AuthContext);
};
