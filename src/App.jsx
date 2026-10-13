import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Navbar from './components/Navbar';
import UploadModal from './components/UploadModal';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Cloud, Heart, Shield } from 'lucide-react';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const toast = useToast();

  const [currentView, setCurrentView] = useState('home');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync default view on initial login or load
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (currentView === 'login' || currentView === 'register' || currentView === 'home') {
          setCurrentView(isAdmin ? 'admin' : 'dashboard');
        }
      } else {
        if (currentView === 'dashboard' || currentView === 'admin') {
          setCurrentView('login');
        }
      }
    }
  }, [user, loading]);

  // Route protection
  useEffect(() => {
    if (!loading) {
      if ((currentView === 'dashboard' || currentView === 'admin') && !user) {
        toast.error('Please log in to access this area.');
        setCurrentView('login');
      } else if (currentView === 'admin' && user && !isAdmin) {
        toast.error('Access denied. Administrator privileges required.');
        setCurrentView('dashboard');
      }
    }
  }, [currentView, user, isAdmin, loading]);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 animate-pulse">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <div className="text-slate-400 font-medium text-sm">Initializing CloudVault...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={user ? () => setIsUploadOpen(true) : null}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentView === 'home' && <LandingPage setCurrentView={setCurrentView} />}
        {currentView === 'login' && <LoginPage setCurrentView={setCurrentView} />}
        {currentView === 'register' && <RegisterPage setCurrentView={setCurrentView} />}
        {currentView === 'dashboard' && (
          <UserDashboard
            key={refreshTrigger}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}
        {currentView === 'admin' && <AdminDashboard key={refreshTrigger} />}
      </main>

      {/* Upload Modal (accessible globally when authenticated) */}
      {user && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-400">CloudVault Storage</span>
            <span>— Complete Full-Stack Cloud Storage Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> End-to-End JWT Auth
            </span>
            <span>•</span>
            <span>10 MB Max Upload Limit</span>
            <span>•</span>
            <span>MySQL & SQLite Dual-Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
