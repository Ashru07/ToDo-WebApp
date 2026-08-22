import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile';
import AssignTask from './components/Tasks/AssignTask';
import Statistics from './components/Statistics/Statistics';
import AlarmScreen from './components/AlarmScreen';

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

      // Create a high-priority channel so notifications pop up on the screen and over the lock screen
      LocalNotifications.createChannel({
        id: 'todo-alarms',
        name: 'Todo Alarms',
        description: 'High priority alarms for tasks',
        importance: 5,
        visibility: 1, // 1 = PUBLIC (shows fully on lock screen)
        vibration: true
      }).catch(console.error);

      // Register notification actions (Stop button)
      LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'ALARM_ACTIONS',
            actions: [
              {
                id: 'stop',
                title: 'Stop Alarm',
                destructive: true
              }
            ]
          }
        ]
      }).catch(console.error);

      // Listen for the Stop action being clicked
      LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        if (notificationAction.actionId === 'stop') {
          // Clear the notification when stop is clicked
          LocalNotifications.cancel({ notifications: [{ id: notificationAction.notification.id }] }).catch(console.error);
        }
      });
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

    // Check if app was cold-booted by an alarm
    CapacitorApp.getLaunchUrl().then(data => {
      if (data && data.url && data.url.includes('todoapp://alarm')) {
        const url = new URL(data.url);
        const message = url.searchParams.get('message') || 'Time to check your tasks';
        const ringtone = url.searchParams.get('ringtone') || 'bell';
        const todoId = url.searchParams.get('todoId');
        navigateRef.current('/alarm-screen', { state: { message, ringtone, todoId } });
      }
    });

    const urlListener = CapacitorApp.addListener('appUrlOpen', data => {
      if (data && data.url && data.url.includes('todoapp://alarm')) {
        const url = new URL(data.url);
        const message = url.searchParams.get('message') || 'Time to check your tasks';
        const ringtone = url.searchParams.get('ringtone') || 'bell';
        const todoId = url.searchParams.get('todoId');
        navigateRef.current('/alarm-screen', { state: { message, ringtone, todoId } });
      }
    });

    return () => {
      listener.then(l => l.remove());
      urlListener.then(l => l.remove());
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
      <Route 
        path="/alarm-screen" 
        element={<AlarmScreen />} 
      />
    </Routes>
  );
}

export default App;
