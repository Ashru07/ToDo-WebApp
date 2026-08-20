import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}


// Dynamically determine the API URL
const getApiUrl = () => {
  if (Capacitor.isNativePlatform()) {
    // For Android, use the current host IP (or 10.0.2.2 for emulator)
    return 'http://192.168.1.113:3001/api';
  }
  // For web, use the current hostname to avoid IP changes breaking the app
  return `http://${window.location.hostname}:3001/api`;
};

export const API_URL = getApiUrl();
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for logged in user on mount
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(JSON.parse(loggedInUser));
    }
    setLoading(false);
  }, []);

  const register = async (email, password, name, gmailAppPassword) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, gmailAppPassword })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    await login(email, password);
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Exclude password from the currentUser object saved in session
    const { password: _, ...userWithoutPassword } = data;
    setCurrentUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const deleteAccount = async () => {
    if (currentUser) {
      try {
        await fetch(`${API_URL}/users/${encodeURIComponent(currentUser.email)}`, {
          method: 'DELETE'
        });
        logout();
      } catch (err) {
        console.error('Failed to delete account:', err);
      }
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
