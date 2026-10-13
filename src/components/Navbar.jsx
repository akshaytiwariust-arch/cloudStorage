import React, { useState } from 'react';
import { Cloud, ShieldCheck, User, LogOut, UploadCloud, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenUpload, currentView, setCurrentView }) {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-900/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => setCurrentView(user ? (isAdmin ? 'admin' : 'dashboard') : 'home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                CloudFileStorageSystem
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Storage
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentView === 'dashboard'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  My Files
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      currentView === 'admin'
                        ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-700/60'
                        : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/40'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Admin Panel
                  </button>
                )}

                {onOpenUpload && (
                  <button
                    onClick={onOpenUpload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload File
                  </button>
                )}

                {/* User info & Logout */}
                <div className="h-6 w-px bg-slate-800 mx-1" />

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-750">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        user.role === 'admin' ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setCurrentView('home');
                  }}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/20 transition"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-400 mt-0.5">
                    Role: {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-slate-800 text-left"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                My Dashboard & Files
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setCurrentView('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-indigo-300 hover:bg-slate-800 text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Admin Dashboard
                </button>
              )}

              {onOpenUpload && (
                <button
                  onClick={() => {
                    onOpenUpload();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Files (Max 10MB)
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:bg-rose-950/30 text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setCurrentView('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-center text-sm font-medium text-slate-200 bg-slate-800 rounded-lg"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setCurrentView('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-center text-sm font-semibold text-white bg-blue-600 rounded-lg"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
