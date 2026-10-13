import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  HardDrive,
  FileBox,
  Trash2,
  Download,
  Search,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Mail,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatDate } from '../utils/formatters';
import FileIcon from '../components/FileIcon';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'files'
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalStorageBytes: 0,
  });

  const [usersList, setUsersList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [userToDelete, setUserToDelete] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  // Fetch admin stats, users, and files
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, filesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/files'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (usersRes.data.success) {
        setUsersList(usersRes.data.users || []);
      }
      if (filesRes.data.success) {
        setFilesList(filesRes.data.files || []);
      }
    } catch (err) {
      toast.error('Failed to load admin management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filtered users
  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered files
  const filteredFiles = filesList.filter(
    (f) =>
      f.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.uploader_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.uploader_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.file_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Admin download file
  const handleAdminDownload = async (file) => {
    try {
      toast.info(`Downloading "${file.original_filename}"...`);
      const response = await api.get(`/admin/files/${file.id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: file.file_type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Admin download failed.');
    }
  };

  // Admin delete file
  const confirmFileDelete = async () => {
    if (!fileToDelete) return;
    setActionProcessing(true);
    try {
      const res = await api.delete(`/admin/files/${fileToDelete.id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setFilesList((prev) => prev.filter((f) => f.id !== fileToDelete.id));
        setStats((prev) => ({
          ...prev,
          totalFiles: Math.max(0, prev.totalFiles - 1),
          totalStorageBytes: Math.max(0, prev.totalStorageBytes - fileToDelete.file_size),
        }));
        setFileToDelete(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Admin delete user
  const confirmUserDelete = async () => {
    if (!userToDelete) return;
    setActionProcessing(true);
    try {
      const res = await api.delete(`/admin/users/${userToDelete.id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
        // Also remove their files from filesList
        setFilesList((prev) => prev.filter((f) => f.user_id !== userToDelete.id));
        fetchAdminData();
        setUserToDelete(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Administration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global monitoring, user account governance, and cloud storage management.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer self-start sm:self-auto text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-850/70 border border-slate-800 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalUsers}</div>
          <div className="text-xs text-slate-500 mt-1">Active platform accounts</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-850/70 border border-slate-800 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Stored Files</span>
            <FileBox className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalFiles}</div>
          <div className="text-xs text-slate-500 mt-1">Across all users</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-850/70 border border-slate-800 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Storage Occupied</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {formatBytes(stats.totalStorageBytes)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Global server disk utilization</div>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Users Management ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'files'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            All Cloud Files ({filesList.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'users' ? 'Search users...' : 'Search files or uploaders...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* TAB 1: USERS MANAGEMENT TABLE */}
      {activeTab === 'users' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-850/60 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Registered On</th>
                <th className="py-3.5 px-4">Uploaded Files</th>
                <th className="py-3.5 px-4">Storage Used</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                    No users matching the query found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === user.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">
                              {u.name} {isCurrentAdmin && <span className="text-xs text-indigo-400 font-normal">(You)</span>}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            u.role === 'admin'
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-200">
                        {u.file_count || 0} files
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-200">
                        {formatBytes(u.total_storage_bytes || 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setUserToDelete(u)}
                          disabled={isCurrentAdmin}
                          title={isCurrentAdmin ? 'Cannot delete yourself' : 'Delete User & Files'}
                          className={`p-1.5 rounded-lg transition ${
                            isCurrentAdmin
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ALL FILES TABLE */}
      {activeTab === 'files' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-850/60 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                    No files found across the system.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/40 transition group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <FileIcon
                          mimeType={file.file_type}
                          filename={file.original_filename}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-slate-200 group-hover:text-indigo-400 transition truncate max-w-xs sm:max-w-md">
                          {file.original_filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-slate-200">
                        {file.uploader_name || 'User #' + file.user_id}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {file.uploader_email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-750">
                        {file.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-300">
                      {formatBytes(file.file_size)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {formatDate(file.uploaded_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAdminDownload(file)}
                          title="Admin Download"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setFileToDelete(file)}
                          title="Admin Delete File"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete User Modal */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => !actionProcessing && setUserToDelete(null)}
        title="Confirm User Account Deletion"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              Are you sure you want to delete user{' '}
              <span className="font-semibold text-white">
                "{userToDelete?.name}" ({userToDelete?.email})
              </span>
              ? All of their uploaded files will also be permanently purged from the server storage!
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={actionProcessing}
              onClick={() => setUserToDelete(null)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionProcessing}
              onClick={confirmUserDelete}
              className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {actionProcessing ? 'Deleting...' : 'Delete User and Files'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete File Modal */}
      <Modal
        isOpen={!!fileToDelete}
        onClose={() => !actionProcessing && setFileToDelete(null)}
        title="Admin File Deletion"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              Delete file{' '}
              <span className="font-semibold text-white">
                "{fileToDelete?.original_filename}"
              </span>{' '}
              uploaded by {fileToDelete?.uploader_name} ({fileToDelete?.uploader_email})?
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={actionProcessing}
              onClick={() => setFileToDelete(null)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionProcessing}
              onClick={confirmFileDelete}
              className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {actionProcessing ? 'Deleting...' : 'Delete File'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
