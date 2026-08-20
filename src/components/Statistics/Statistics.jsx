import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, API_URL } from '../../contexts/AuthContext';
import { 
  format, isWithinInterval, startOfDay, endOfDay, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, parseISO, isBefore
} from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../Navigation/Navbar';

const PRIORITIES = ['low', 'medium', 'high']
const CATEGORIES = ['personal', 'work', 'shopping', 'health', 'learning', 'other']

export default function Statistics() {
  const { currentUser } = useAuth();
  const { timeframe = 'daily' } = useParams();

  const [todos, setTodos] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetch(`${API_URL}/todos?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => setTodos(data));
    }
  }, [currentUser]);

  const dateFilteredTodos = useMemo(() => {
    const now = new Date();
    let start, end;
    
    switch (timeframe) {
      case 'daily':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'weekly':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'yearly':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfDay(now);
        end = endOfDay(now);
    }

    return todos.filter(todo => {
      const todoDate = todo.dueDate ? parseISO(todo.dueDate) : parseISO(todo.createdAt);
      return isWithinInterval(todoDate, { start, end });
    });
  }, [todos, timeframe]);

  const isTimePassed = (todo) => {
    if (!todo.time) return false;
    const todoDate = todo.dueDate ? parseISO(todo.dueDate) : parseISO(todo.createdAt);
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

  // Calculations for charts
  const total = dateFilteredTodos.length;
  const completed = dateFilteredTodos.filter(t => t.completed).length;
  const active = dateFilteredTodos.filter(t => !t.completed && !isTimePassed(t)).length;
  const due = dateFilteredTodos.filter(t => !t.completed && isTimePassed(t)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const priorityData = PRIORITIES.map(p => ({
    name: p,
    value: dateFilteredTodos.filter(t => t.priority === p).length
  })).filter(item => item.value > 0);

  const categoryData = CATEGORIES.map(c => ({
    name: c,
    value: dateFilteredTodos.filter(t => t.category === c).length
  })).filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen p-3 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto overflow-hidden">
        <header className="mb-4 animate-fade-in mt-2">
          <div className="flex justify-between items-stretch mb-4 gap-4">
            <div className="flex flex-col justify-center overflow-hidden pr-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent capitalize leading-none truncate">
                {timeframe} Statistics
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-none mt-1 truncate">
                Analysis for your {timeframe} productivity
              </p>
            </div>
            <div className="flex flex-col justify-start items-end shrink-0">
              <Navbar />
            </div>
          </div>
        </header>

        {total === 0 ? (
          <div className="glass rounded-2xl p-12 text-center animate-fade-in">
            <Calendar size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">No data for this period</h2>
            <p className="text-slate-500">Try adding some tasks to see statistics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            
            <div className="glass rounded-2xl p-6 lg:col-span-3">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{total}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tasks</div>
                </div>
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-5xl font-bold text-green-500 dark:text-green-400 mb-2">{completionRate}%</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion Rate</div>
                </div>
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-5xl font-bold text-orange-500 dark:text-orange-400 mb-2">{active}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Tasks</div>
                </div>
                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-5xl font-bold text-red-500 dark:text-red-400 mb-2">{due}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Tasks</div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 lg:col-span-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">By Priority</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ color: '#1e293b', fontWeight: '500', textTransform: 'capitalize' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">By Category</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
