import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile';
import AssignTask from './components/Tasks/AssignTask';
import Statistics from './components/Statistics/Statistics';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = React.useRef(location);
  const navigateRef = React.useRef(navigate);

  useEffect(() => {
    locationRef.current = location;
    navigateRef.current = navigate;
  }, [location, navigate]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(console.error);
      StatusBar.setStyle({ style: Style.Light }).catch(console.error);
      StatusBar.setBackgroundColor({ color: '#F4F7FB' }).catch(console.error); // Very light slate blue matching the top gradient
    }
  }, []);

  window.onHardwareBackCallbacks = [];

  useEffect(() => {
    const handleBackButton = () => {
      if (window.onHardwareBackCallbacks && window.onHardwareBackCallbacks.length > 0) {
        const topCallback = window.onHardwareBackCallbacks[window.onHardwareBackCallbacks.length - 1];
        topCallback();
        return;
      }

      const currentPath = locationRef.current.pathname;
      if (currentPath === '/dashboard' || currentPath === '/login' || currentPath === '/') {
        CapacitorApp.exitApp();
      } else {
        navigateRef.current(-1);
      }
    };

    const listener = CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return (
    <Routes>
      <Route 
        path="/" 
        element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} 
      />
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={currentUser ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/assign-task" 
        element={
          <ProtectedRoute>
            <AssignTask />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/statistics/:timeframe" 
        element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
