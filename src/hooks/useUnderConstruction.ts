import { useState, useEffect } from 'react';

const UNDER_CONSTRUCTION_KEY = 'wedding_under_construction';
const ADMIN_MODE_KEY = 'wedding_admin_mode';

export const useUnderConstruction = () => {
  const [isUnderConstruction, setIsUnderConstruction] = useState<boolean>(() => {
    const stored = localStorage.getItem(UNDER_CONSTRUCTION_KEY);
    return stored ? JSON.parse(stored) : false; // Default to false (website active)
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const stored = localStorage.getItem(ADMIN_MODE_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem(UNDER_CONSTRUCTION_KEY, JSON.stringify(isUnderConstruction));
  }, [isUnderConstruction]);

  useEffect(() => {
    localStorage.setItem(ADMIN_MODE_KEY, JSON.stringify(isAdmin));
  }, [isAdmin]);

  const toggleUnderConstruction = () => {
    setIsUnderConstruction(prev => !prev);
  };

  // Function to handle admin logout
  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_MODE_KEY);
  };

  return {
    isUnderConstruction,
    isAdmin,
    toggleUnderConstruction,
    setIsAdmin,
    logoutAdmin
  };
};