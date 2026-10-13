import React from 'react';
import { Cloud, ShieldCheck, Zap, HardDrive, Lock, ArrowRight, CheckCircle, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ setCurrentView }) {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden py-12 md:py-20">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Next-Generation Cloud File Storage</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Store, Manage, and Access Your Files{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Securely Anywhere
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A lightning-fast, secure cloud file management platform. Upload multiple files up to 10 MB each, track your storage quota in real time, and manage users with role-based access control.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl shadow-blue-600/25 transition cursor-pointer"
            >
              Go to Your Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setCurrentView('register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl shadow-blue-600/25 transition cursor-pointer"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-base transition cursor-pointer"
              >
                Sign In to Vault
              </button>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-850/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition">
            <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">High-Speed Uploads</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drag-and-drop multiple files seamlessly. Real-time progress indicators and automatic 10 MB per-file validation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-850/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Private & Isolated</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict role-based authorization with bcrypt password hashing and tamper-proof JWT tokens. Users only see their own files.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-850/60 border border-slate-800 backdrop-blur-sm hover:border-slate-700 transition">
            <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Dedicated Admin Hub</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Comprehensive administrator tools to view storage metrics, audit all files across accounts, and manage users.
            </p>
          </div>
        </div>

        {/* Storage stats highlight banner */}
        <div className="mt-14 p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 via-slate-800/40 to-indigo-900/30 border border-blue-500/20 flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-white">10 MB</div>
            <div className="text-xs text-slate-400">Max File Size</div>
          </div>
          <div className="h-8 w-px bg-slate-750 hidden sm:block" />
          <div>
            <div className="text-2xl font-bold text-white">Multi-File</div>
            <div className="text-xs text-slate-400">Batch Upload Support</div>
          </div>
          <div className="h-8 w-px bg-slate-750 hidden sm:block" />
          <div>
            <div className="text-2xl font-bold text-white">Bcrypt + JWT</div>
            <div className="text-xs text-slate-400">Military-Grade Auth</div>
          </div>
          <div className="h-8 w-px bg-slate-750 hidden sm:block" />
          <div>
            <div className="text-2xl font-bold text-white">MySQL + SQLite</div>
            <div className="text-xs text-slate-400">Dual Database Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
}
