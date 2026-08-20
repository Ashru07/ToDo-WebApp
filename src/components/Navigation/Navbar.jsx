import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, Home, User, BarChart2, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (isOpen) {
      const handleBack = () => {
        closeMenu();
      };
      if (!window.onHardwareBackCallbacks) window.onHardwareBackCallbacks = [];
      window.onHardwareBackCallbacks.push(handleBack);
      return () => {
        window.onHardwareBackCallbacks = window.onHardwareBackCallbacks.filter(c => c !== handleBack);
      };
    }
  }, [isOpen]);

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 rounded-full glass hover:scale-110 transition-transform duration-200 shadow-sm"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-700" />}
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-full glass hover:scale-110 transition-transform duration-200 shadow-sm text-slate-800 dark:text-slate-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={closeMenu}
        />
      )}

      {/* Drawer Content */}
      <div 
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Menu</h2>
          <button 
            onClick={closeMenu}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link 
            to="/dashboard" 
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 font-medium transition-colors"
          >
            <Home size={20} />
            Home
          </Link>
          
          <Link 
            to="/profile" 
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 font-medium transition-colors"
          >
            <User size={20} />
            Profile
          </Link>

          <div>
            <button 
              onClick={() => setStatsOpen(!statsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 font-medium transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart2 size={20} />
                Statistics
              </div>
              {statsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {/* Statistics Submenu */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${statsOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="pl-11 pr-4 space-y-1 py-1">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((time) => (
                  <Link
                    key={time}
                    to={`/statistics/${time.toLowerCase()}`}
                    onClick={closeMenu}
                    className="block px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                  >
                    {time}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
