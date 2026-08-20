import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Check, Clock, Bell } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { messaging } from '../../firebase';
import { getToken } from 'firebase/messaging';

const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['personal', 'work', 'shopping', 'health', 'learning', 'other'];

const PriorityBadge = ({ priority }) => {
  const colors = {
    high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority] || colors.medium}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const CategoryBadge = ({ category }) => (
  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
    {category.charAt(0).toUpperCase() + category.slice(1)}
  </span>
);

export default function TaskDetailsModal({ 
  isOpen, 
  task, 
  onClose, 
  onDelete, 
  onToggleComplete, 
  onSave,
  getRemainingTimeText
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const handleBack = () => {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      };
      if (!window.onHardwareBackCallbacks) window.onHardwareBackCallbacks = [];
      window.onHardwareBackCallbacks.push(handleBack);
      return () => {
        window.onHardwareBackCallbacks = window.onHardwareBackCallbacks.filter(c => c !== handleBack);
      };
    }
  }, [isOpen, isEditing, onClose]);

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
      setIsEditing(false);
    }
  }, [task]);

  if (!isOpen || !task || !formData) return null;

  const handleSave = () => {
    onSave(task.id, formData);
    setIsEditing(false);
  };

  const remainingTime = getRemainingTimeText ? getRemainingTimeText(task) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isEditing ? 'Edit Task' : 'Task Details'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={formData.text}
                  onChange={(e) => setFormData({...formData, text: e.target.value})}
                  placeholder="What needs to be done?"
                  className="input-field mb-3"
                  autoFocus
                />
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Add more details about this task..."
                  className="input-field min-h-[80px] resize-y py-2"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.dueDate ? format(parseISO(formData.dueDate), 'yyyy-MM-dd') : format(parseISO(formData.createdAt), 'yyyy-MM-dd')}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({...formData, dueDate: parseISO(e.target.value).toISOString()});
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    className="input-field"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Priority</label>
                  <select
                    className="input-field"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.hasAlarm}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      let newToken = formData.fcmToken;
                      if (checked && messaging && import.meta.env.VITE_FIREBASE_VAPID_KEY && import.meta.env.VITE_FIREBASE_VAPID_KEY !== 'your_vapid_key_here') {
                        try {
                          const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
                          if (token) newToken = token;
                        } catch(err) {
                          console.error(err);
                        }
                      }
                      setFormData({...formData, hasAlarm: checked, fcmToken: newToken});
                    }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Bell size={16} className={formData.hasAlarm ? 'text-blue-500' : 'text-slate-400'} />
                    Set Custom Alarm
                  </span>
                </label>

                {formData.hasAlarm && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Alert Time</label>
                      <select
                        className="input-field text-sm"
                        value={formData.alarmOffset || 0}
                        onChange={(e) => setFormData({...formData, alarmOffset: Number(e.target.value)})}
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
                        value={formData.ringtone || 'bell'}
                        onChange={(e) => setFormData({...formData, ringtone: e.target.value})}
                      >
                        <option value="bell">Bell</option>
                        <option value="chime">Chime</option>
                        <option value="digital">Digital</option>
                        <option value="custom">Custom (Upload)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                      <input
                        type="text"
                        placeholder="Alarm message..."
                        className="input-field text-sm"
                        value={formData.alarmMessage || ''}
                        onChange={(e) => setFormData({...formData, alarmMessage: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className={`text-xl font-bold text-slate-800 dark:text-slate-100 break-words ${task.completed ? 'line-through text-slate-400' : ''}`}>
                    {task.text}
                  </h3>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        onDelete(task.id);
                        onClose();
                      }}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {task.description && (
                  <p className={`mt-2 text-slate-600 dark:text-slate-400 whitespace-pre-wrap ${task.completed ? 'opacity-70' : ''}`}>
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {task.time && (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Clock size={12} />
                    Time: {task.time}
                  </span>
                )}
                {!task.completed && remainingTime && (
                  <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${remainingTime === 'Overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    Remains: {remainingTime}
                  </span>
                )}
                {task.hasAlarm && (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    <Bell size={12} />
                    Alarm Set
                  </span>
                )}
                <PriorityBadge priority={task.priority} />
                <CategoryBadge category={task.category} />
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    onToggleComplete(task.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${
                    task.completed 
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30'
                  }`}
                >
                  <Check size={20} />
                  {task.completed ? 'Mark as Incomplete' : 'Complete Task'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer for Edit Mode */}
        {isEditing && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
