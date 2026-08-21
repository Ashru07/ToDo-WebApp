import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Edit2, Search, Filter, Clock, Flag, Tag, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, AlertTriangle, BarChart2, Layers } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, API_URL } from '../../contexts/AuthContext'
import { format, addDays, subDays, isSameDay, parseISO, startOfDay, isBefore, addMinutes, formatDistanceToNow } from 'date-fns'
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { messaging } from '../../firebase'
import { getToken } from 'firebase/messaging'
import Navbar from '../Navigation/Navbar'
import TaskDetailsModal from '../Tasks/TaskDetailsModal'

const PRIORITIES = ['low', 'medium', 'high']
const CATEGORIES = ['personal', 'work', 'shopping', 'health', 'learning', 'other']

function Dashboard() {
  const AlarmPlugin = registerPlugin('AlarmPlugin');
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('due') // all, active, due, completed

  useEffect(() => {
    if (currentUser) {
      fetch(`${API_URL}/todos?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          setTodos(data);
          const hasDue = data.some(todo => {
            if (todo.completed || !todo.time) return false;
            const todoDate = todo.dueDate ? parseISO(todo.dueDate) : (todo.createdAt ? new Date(todo.createdAt) : new Date());
            if (!isSameDay(todoDate, new Date())) return false;
            const today = startOfDay(new Date());
            const dateOfTodo = startOfDay(todoDate);
            if (isBefore(dateOfTodo, today)) return true;
            if (isBefore(today, dateOfTodo)) return false;
            const now = new Date();
            const [hours, minutes] = todo.time.split(':').map(Number);
            const todoDateTime = new Date();
            todoDateTime.setHours(hours, minutes, 0, 0);
            return isBefore(todoDateTime, now);
          });
          if (!hasDue) setFilter('active');
        })
    }
  }, [currentUser])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showOverdue, setShowOverdue] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(null)

  // Alarm Check Logic
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();

      todos.forEach(todo => {
        if (!todo.completed && todo.hasAlarm && todo.time) {
          const offsetNow = addMinutes(now, todo.alarmOffset || 0);
          const checkHours = offsetNow.getHours().toString().padStart(2, '0');
          const checkMinutes = offsetNow.getMinutes().toString().padStart(2, '0');
          const checkTimeString = `${checkHours}:${checkMinutes}`;

          if (todo.time === checkTimeString) {
            const todoDate = todo.dueDate ? parseISO(todo.dueDate) : (todo.createdAt ? new Date(todo.createdAt) : new Date());
            if (isSameDay(todoDate, now)) {
              if (!todo.alarmTriggered) {
                triggerAlarm(todo);
              }
            }
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [todos]);

  const triggerAlarm = (todo) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Todo Alarm!', {
        body: todo.alarmMessage || `Time for: ${todo.text}`,
        icon: '/favicon.ico'
      });
    } else {
      alert(`ALARM: ${todo.alarmMessage || todo.text}`);
    }

    try {
      const currentRingtone = todo.ringtone || 'bell';
      if (currentRingtone === 'custom' && todo.customRingtone) {
        const audio = new Audio(todo.customRingtone);
        audio.play().catch(e => console.log('Audio play error:', e));
        const timeoutId = setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          setActiveAlarm(null);
        }, 20000);

        setActiveAlarm({
          todo,
          stop: () => {
            audio.pause();
            audio.currentTime = 0;
            clearTimeout(timeoutId);
            setActiveAlarm(null);
          }
        });
      } else {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const type = currentRingtone === 'chime' ? 'sine' : currentRingtone === 'digital' ? 'square' : 'triangle';
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);

        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        for (let i = 0; i < 40; i++) {
          gainNode.gain.setValueAtTime(1, audioCtx.currentTime + i * 0.5);
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.5 + 0.25);
        }

        oscillator.start();
        const timeoutId = setTimeout(() => {
          try { oscillator.stop(); } catch (e) { }
          setActiveAlarm(null);
        }, 20000);

        setActiveAlarm({
          todo,
          stop: () => {
            try { oscillator.stop(); } catch (e) { }
            clearTimeout(timeoutId);
            setActiveAlarm(null);
          }
        });
      }
    } catch (e) {
      console.log('Audio playback failed', e);
    }

    if (todo.fcmToken) {
      fetch(`${API_URL}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: todo.fcmToken,
          title: 'Todo Alarm!',
          body: todo.alarmMessage || `Hello, this is a reminder for your task: ${todo.text}`,
        }),
      }).catch(err => console.error('Error connecting to alarm server:', err));
    }

    const updatedTodo = { ...todo, alarmTriggered: true };
    setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
    fetch(`${API_URL}/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, todo: updatedTodo })
    }).catch(console.error);
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const updatedTodo = { ...todo, completed: !todo.completed };
    try {
      await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, todo: updatedTodo })
      })
      setTodos(todos.map(t => t.id === id ? updatedTodo : t))
      // Update selectedTask if it is currently open in the modal
      setSelectedTask(prev => prev && prev.id === id ? updatedTodo : prev);
    } catch (e) {
      console.error('Failed to update task', e)
    }
  }

  const deleteTodo = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
      setTodos(todos.filter(todo => todo.id !== id))

      if (Capacitor.isNativePlatform()) {
        // no cancel needed for AlarmPlugin
      }
    } catch (e) {
      console.error('Failed to delete task', e)
    }
  }

  const saveEdit = async (id, formData) => {
    if (!formData.text.trim()) return deleteTodo(id)

    const oldTodo = todos.find(t => t.id === id)
    const isTimeChanged = oldTodo.time !== formData.time || oldTodo.dueDate !== formData.dueDate

    const updatedTodo = {
      ...formData,
      text: formData.text.trim(),
      ...(isTimeChanged ? { alarmTriggered: false } : {})
    }

    try {
      await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, todo: updatedTodo })
      })
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo))

      if (Capacitor.isNativePlatform()) {
        // no cancel needed for AlarmPlugin
        if (updatedTodo.hasAlarm && updatedTodo.time && !updatedTodo.alarmTriggered && !updatedTodo.completed) {
          const [hours, minutes] = updatedTodo.time.split(':').map(Number);
          const alarmDate = updatedTodo.dueDate ? parseISO(updatedTodo.dueDate) : new Date();
          alarmDate.setHours(hours, minutes, 0, 0);
          const triggerDate = new Date(alarmDate.getTime() - (updatedTodo.alarmOffset || 0) * 60000);

          if (triggerDate > new Date()) {
            await AlarmPlugin.setAlarm({ time: triggerDate.getTime(), message: updatedTodo.alarmMessage || `Reminder: ${updatedTodo.text}` }).catch(e => console.error('[NativeAlarm]', e));
          }
        }
      }
    } catch (e) {
      console.error('Failed to update task', e)
    }

    // Update local selectedTask if it's currently open
    setSelectedTask(prev => prev && prev.id === id ? updatedTodo : prev)
  }

  const overdueTodos = todos.filter(todo => {
    if (todo.completed) return false;
    const todoDate = todo.dueDate ? parseISO(todo.dueDate) : (todo.createdAt ? new Date(todo.createdAt) : new Date());
    const today = startOfDay(new Date());
    const dateOfTodo = startOfDay(todoDate);

    if (isBefore(dateOfTodo, today)) {
      return true;
    }

    if (isSameDay(dateOfTodo, today) && todo.time) {
      const now = new Date();
      const [hours, minutes] = todo.time.split(':').map(Number);
      const todoDateTime = new Date();
      todoDateTime.setHours(hours, minutes, 0, 0);

      return isBefore(todoDateTime, now);
    }

    return false;
  });

  const isTimePassed = (todo) => {
    if (!todo.time) return false;
    const todoDate = todo.dueDate ? parseISO(todo.dueDate) : (todo.createdAt ? new Date(todo.createdAt) : new Date());
    const today = startOfDay(new Date());
    const dateOfTodo = startOfDay(todoDate);

    if (isBefore(dateOfTodo, today)) return true;
    if (isBefore(today, dateOfTodo)) return false;

    const now = new Date();
    const [hours, minutes] = todo.time.split(':').map(Number);
    const todoDateTime = new Date();
    todoDateTime.setHours(hours, minutes, 0, 0);
    return isBefore(todoDateTime, now);
  };

  const getRemainingTimeText = (todo) => {
    if (todo.completed) return null;

    const todoDate = todo.dueDate ? parseISO(todo.dueDate) : (todo.createdAt ? new Date(todo.createdAt) : new Date());
    let targetDate = startOfDay(todoDate);

    if (todo.time) {
      const [hours, minutes] = todo.time.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }

    if (isBefore(targetDate, new Date())) {
      return 'Overdue';
    }

    return formatDistanceToNow(targetDate, { addSuffix: true });
  };

  const filteredTodos = (showOverdue ? overdueTodos : todos).filter(todo => {
    const todoDate = todo.dueDate ? parseISO(todo.dueDate) : (todo.createdAt ? new Date(todo.createdAt) : new Date());

    if (!showOverdue && !isSameDay(todoDate, selectedDate)) return false;

    const passesSearch = todo.text.toLowerCase().includes(searchQuery.toLowerCase());
    if (!passesSearch) return false;

    switch (filter) {
      case 'all': return true;
      case 'active': return !todo.completed && !isTimePassed(todo);
      case 'due': return !todo.completed && isTimePassed(todo);
      case 'completed': return todo.completed;
      default: return true;
    }
  });

  const statsTodos = (showOverdue ? overdueTodos : todos).filter(todo => {
    const todoDate = todo.dueDate ? parseISO(todo.dueDate) : (todo.createdAt ? new Date(todo.createdAt) : new Date());
    return isSameDay(todoDate, selectedDate);
  });

  const stats = {
    total: statsTodos.length,
    completed: statsTodos.filter(t => t.completed).length,
  }

  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1))
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const handleToday = () => setSelectedDate(new Date())

  const PriorityBadge = ({ priority }) => {
    const colors = {
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
        {priority}
      </span>
    )
  }

  const CategoryBadge = ({ category }) => {
    const colors = {
      personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      learning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      other: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category]}`}>
        {category}
      </span>
    )
  }

  return (
    <div className="min-h-screen p-3 md:p-8 transition-colors duration-300" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="todo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="#2563eb" offset="0%" />
            <stop stopColor="#4f46e5" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
      <div className="max-w-7xl mx-auto overflow-hidden">
        {/* Header */}
        <header className="mb-4 animate-fade-in mt-2">
          <div className="flex justify-between items-stretch mb-4 gap-4">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <Layers className="w-8 h-8" style={{ stroke: "url(#todo-gradient)" }} />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none">
                  To Do
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-none mt-1">
                Welcome back, {currentUser.name}
              </p>
            </div>
            <div className="flex flex-col justify-between items-end">
              <Navbar />
              <button
                onClick={() => setShowOverdue(!showOverdue)}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg transition-colors mt-1 ${
                  showOverdue 
                  ? 'bg-red-500 text-white shadow-lg' 
                  : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                }`}
              >
                <AlertTriangle size={14} />
                {overdueTodos.length > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{overdueTodos.length}</span>}
                Overdue
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex items-center justify-between glass rounded-lg p-1.5 mb-3">
            <button onClick={handlePrevDay} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>

            <div className="flex flex-col items-center relative">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 relative cursor-pointer hover:opacity-80 transition-opacity">
                <CalendarIcon size={16} />
                <span className="font-medium text-base">{format(selectedDate, 'MMMM d, yyyy')}</span>
                <input
                  type="date"
                  className="calendar-overlay absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(parseISO(e.target.value))
                    }
                  }}
                />
              </div>
              <button
                onClick={handleToday}
                className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
              >
                {isSameDay(selectedDate, new Date()) ? 'Today' : 'Go to Today'}
              </button>
            </div>

            <button onClick={handleNextDay} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="glass rounded-lg p-2.5 mb-4 animate-fade-in">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Progress for {format(selectedDate, 'MMM d')}
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 max-w-6xl mx-auto gap-4 lg:gap-8">
          {/* Left Column - Assign Task & Statistics Links */}
          <div className="lg:col-span-1 space-y-3">
            {/* Assign Task Button */}
            <div className="glass rounded-lg p-2 animate-slide-up">
              <button onClick={() => navigate('/assign-task')} className="btn-primary w-full flex items-center justify-center gap-2 py-1.5 text-sm">
                <Plus size={16} />
                Assign Task
              </button>
            </div>
          </div>

          {/* Right Column - Todo List */}
          <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass rounded-2xl p-2 min-h-[600px]">
              {/* Search & Filter */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ stroke: "url(#todo-gradient)" }} size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="input-field pl-10 py-1.5 md:py-2 text-sm md:text-base w-full"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 w-full">
                  {['all', 'active', 'due', 'completed'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 text-center whitespace-nowrap px-2 py-1.5 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-medium transition-all duration-200 flex-shrink-0 ${filter === f
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Todo List */}
              {filteredTodos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-full mb-4">
                    <CalendarIcon size={48} className="text-slate-400" />
                  </div>
                  <p className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {filter === 'due' && statsTodos.length === 0 ? 'No tasks for this day' : 'No matching tasks'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-500">
                    {filter === 'due' && statsTodos.length === 0
                      ? `Enjoy your day or add a task for ${format(selectedDate, 'MMM d')}!`
                      : 'Try adjusting your search or filter'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTodos.map(todo => (
                    <div
                      key={todo.id}
                      className={`task-item glass rounded-xl p-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors ${todo.completed ? 'opacity-75' : ''}`}
                      onClick={() => setSelectedTask(todo)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }}
                            className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${todo.completed
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-slate-400 dark:bg-transparent dark:border-slate-600 hover:border-blue-500'
                              }`}
                          >
                            {todo.completed && <Check size={14} className="text-white" />}
                          </button>

                          <p className={`text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 truncate ${todo.completed ? 'line-through text-slate-400' : ''
                            }`}>
                            {todo.text}
                          </p>
                        </div>

                        {!todo.completed && getRemainingTimeText(todo) && (
                          <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRemainingTimeText(todo) === 'Overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {getRemainingTimeText(todo)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Alarm Banner */}
      {activeAlarm && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-2xl border-l-4 border-red-500 z-50 animate-bounce w-80 max-w-[calc(100vw-3rem)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500">
              <Bell size={24} className="animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Alarm Ringing!</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 ml-1">
            {activeAlarm.todo.text}
          </p>
          <button
            onClick={() => activeAlarm.stop()}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle size={18} />
            Stop Alarm
          </button>
        </div>
      )}

      <TaskDetailsModal
        isOpen={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onDelete={deleteTodo}
        onToggleComplete={toggleTodo}
        onSave={saveEdit}
        getRemainingTimeText={getRemainingTimeText}
      />
    </div>
  )
}

export default Dashboard
