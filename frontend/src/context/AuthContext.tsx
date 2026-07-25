import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
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
  setAuthUser: Dispatch<SetStateAction<AuthUser | null>>;
  isLoading: boolean;
  isAuthenticated: boolean;
}
export const AuthContext = createContext<AuthContextType>({
  authUser: null,
  setAuthUser: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthUser: Dispatch<SetStateAction<AuthUser | null>> = (value) => {
    setAuthUser((currentUser) => {
      const nextUser =
        typeof value === "function" ? value(currentUser) : value;
      setIsAuthenticated(Boolean(nextUser));
      return nextUser;
    });
  };

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
      value={{ authUser, setAuthUser: updateAuthUser, isAuthenticated, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  return useContext(AuthContext);
};
