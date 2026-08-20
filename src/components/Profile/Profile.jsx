import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail } from 'lucide-react';
import Navbar from '../Navigation/Navbar';

export default function Profile() {
  const { currentUser, deleteAccount } = useAuth();

  return (
    <div className="min-h-screen p-3 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto overflow-hidden">
        <header className="mb-4 animate-fade-in mt-2">
          <div className="flex justify-between items-stretch mb-4 gap-4">
            <div className="flex flex-col justify-center overflow-hidden pr-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-none truncate">
                Your Profile
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-none mt-1 truncate">
                Manage your account
              </p>
            </div>
            <div className="flex flex-col justify-start items-end shrink-0">
              <Navbar />
            </div>
          </div>
        </header>

        {/* User Details Card */}
        <div className="glass rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <User size={48} className="text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 mt-2">
                <Mail size={16} />
                <span>{currentUser.email}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This will permanently delete all your tasks and cannot be undone.')) {
                  deleteAccount();
                }
              }}
              className="px-5 py-2.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800/50"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
