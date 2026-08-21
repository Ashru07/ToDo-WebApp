import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Bell } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { messaging } from '../../firebase';
import { getToken } from 'firebase/messaging';
import { parseISO, format } from 'date-fns';
import Navbar from '../Navigation/Navbar';

const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['personal', 'work', 'shopping', 'health', 'learning', 'other'];

export default function AssignTask() {
  const AlarmPlugin = registerPlugin('AlarmPlugin');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [newTodo, setNewTodo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('personal');
  const [newTime, setNewTime] = useState('');
  const [setAlarm, setSetAlarm] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState('');
  const [ringtone, setRingtone] = useState('bell');
  const [fcmToken, setFcmToken] = useState('');
  const [alarmOffset, setAlarmOffset] = useState(5);
  const [customRingtone, setCustomRingtone] = useState(null);

  const handleAlarmToggle = async (checked) => {
    setSetAlarm(checked);
    if (checked) {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      try {
        if (messaging && import.meta.env.VITE_FIREBASE_VAPID_KEY && import.meta.env.VITE_FIREBASE_VAPID_KEY !== 'your_vapid_key_here') {
          const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
          if (token) {
            setFcmToken(token);
          }
        }
      } catch (err) {
        console.error('An error occurred while retrieving FCM token: ', err);
      }
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todo = {
      id: Date.now(),
      text: newTodo.trim(),
      description: newDescription.trim(),
      completed: false,
      priority: newPriority,
      category: newCategory,
      time: newTime,
      hasAlarm: setAlarm,
      alarmMessage,
      ringtone,
      customRingtone,
      fcmToken,
      alarmOffset,
      alarmTriggered: false,
      createdAt: new Date().toISOString(),
      dueDate: selectedDate.toISOString(),
    };

    try {
      const res = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, todo })
      });
      const savedTodo = await res.json();
      
      if (Capacitor.isNativePlatform() && savedTodo.hasAlarm && savedTodo.time) {
        try {
          const hasPerm = await LocalNotifications.checkPermissions();
          if (hasPerm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
          const [hours, minutes] = savedTodo.time.split(':').map(Number);
          const alarmDate = savedTodo.dueDate ? parseISO(savedTodo.dueDate) : new Date();
          alarmDate.setHours(hours, minutes, 0, 0);
          const triggerDate = new Date(alarmDate.getTime() - (savedTodo.alarmOffset || 0) * 60000);
          
          if (triggerDate > new Date() && setAlarm) {
            await AlarmPlugin.setAlarm({ 
              time: triggerDate.getTime(),
              message: savedTodo.alarmMessage || `Reminder: ${savedTodo.text}`
            });
          }
        } catch (err) {
          console.error('LocalNotification schedule error', err);
        }
      }
      navigate('/dashboard'); // Go back to Home
    } catch (e) {
      console.error('Failed to save task', e);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto overflow-hidden">
        <header className="mb-4 animate-fade-in mt-2">
          <div className="flex justify-between items-stretch mb-4 gap-4">
            <div className="flex flex-col justify-center overflow-hidden pr-2">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 glass hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm">
                  <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                </button>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none truncate">
                  Assign Task
                </h1>
              </div>
            </div>
            <div className="flex flex-col justify-start items-end shrink-0">
              <Navbar />
            </div>
          </div>
        </header>

        <div className="glass rounded-2xl p-6 animate-slide-up">
          <form onSubmit={addTodo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Task Name
              </label>
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What needs to be done?"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add more details about this task..."
                className="input-field min-h-[80px] resize-y py-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(parseISO(e.target.value))
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Time (Optional)
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  className="input-field"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  className="input-field"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alarm Settings */}
            <div className="glass p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 mt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={setAlarm}
                  onChange={(e) => handleAlarmToggle(e.target.checked)}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Bell size={16} className={setAlarm ? 'text-blue-500' : 'text-slate-400'} />
                  Set Custom Alarm
                </span>
              </label>

              {setAlarm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-up mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Alert Time</label>
                    <select
                      className="input-field text-sm"
                      value={alarmOffset}
                      onChange={(e) => setAlarmOffset(Number(e.target.value))}
                    >
                      <option value={0}>At time of event</option>
                      <option value={5}>5 minutes before</option>
                      <option value={10}>10 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Ringtone</label>
                    <select
                      className="input-field text-sm"
                      value={ringtone}
                      onChange={(e) => setRingtone(e.target.value)}
                    >
                      <option value="bell">Bell</option>
                      <option value="chime">Chime</option>
                      <option value="digital">Digital</option>
                      <option value="custom">Custom (Upload)</option>
                    </select>
                    {ringtone === 'custom' && (
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="mt-2 text-xs"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 1024 * 1024) {
                              alert('File size must be less than 1MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => setCustomRingtone(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                    <input
                      type="text"
                      placeholder="Alarm message..."
                      className="input-field text-sm"
                      value={alarmMessage}
                      onChange={(e) => setAlarmMessage(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6 py-3"
            >
              <Plus size={18} />
              Create Task
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
