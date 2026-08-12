import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!isSignedIn) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get('/auth/me')
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    refetch();
  }, [isLoaded, isSignedIn, refetch]);

  return (
    <UserContext.Provider value={{ profile, loading, refetch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => useContext(UserContext);