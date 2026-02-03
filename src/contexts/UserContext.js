import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUserId } from '../services/userService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const id = await getCurrentUserId();
    setUserId(id);
    setIsLoading(false);
  };

  const refreshUser = async () => {
    const id = await getCurrentUserId();
    setUserId(id);
  };

  return (
    <UserContext.Provider value={{ userId, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser doit être utilisé dans un UserProvider');
  }
  return context;
};
