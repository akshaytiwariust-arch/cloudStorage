import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Search,
  HardDrive,
  FolderOpen,
  Filter,
  LayoutGrid,
  List,
  AlertCircle,
  Clock,
  CheckCircle,
  FileBox,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatDate, getFileCategory } from '../utils/formatters';
import FileIcon from '../components/FileIcon';
import Modal from '../components/Modal';

export default function UserDashboard({ onOpenUpload }) {
  const { user } = useAuth();
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalStorageBytes: 0,
    storageLimitBytes: 100 * 1024 * 1024,
    availableStorageBytes: 100 * 1024 * 1024,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Delete modal state
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch files and storage stats
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files');
      if (res.data.success) {
        setFiles(res.data.files || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      toast.error('Failed to load your files. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter files by search term and selected category
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        f.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.file_type.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;

      const cat = getFileCategory(f.file_type, f.original_filename);
      return cat === selectedCategory;
    });
  }, [files, searchQuery, selectedCategory]);

  // Handle file download
  const handleDownload = async (file) => {
    try {
      toast.info(`Downloading "${file.original_filename}"...`);
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: 'blob',
      });

      // Create a link element to trigger the download
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
      toast.error('Download failed. File may be missing or inaccessible.');
    }
  };

  // Confirm delete handler
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);

    try {
      const res = await api.delete(`/files/${fileToDelete.id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'File deleted successfully.');
        setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        setFileToDelete(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Storage percentage calculation
  const storagePercentage = useMemo(() => {
    if (!stats.storageLimitBytes || stats.storageLimitBytes === 0) return 0;
    const pct = (stats.totalStorageBytes / stats.storageLimitBytes) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  }, [stats]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome & Storage Summary Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your personal cloud documents, photos, and files securely.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              title="Refresh Files"
              className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        </div>

        {/* Storage Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {/* Card 1: Total Files */}
          <div className="p-5 rounded-2xl bg-slate-850/70 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Files</span>
              <FileBox className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalFiles}</div>
            <div className="text-xs text-slate-500 mt-1">Uploaded to your account</div>
          </div>

          {/* Card 2: Storage Used */}
          <div className="p-5 rounded-2xl bg-slate-850/70 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Storage Used</span>
              <HardDrive className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatBytes(stats.totalStorageBytes)}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {formatBytes(stats.storageLimitBytes)}
              </span>
            </div>
            {/* Storage Progress bar */}
            <div className="w-full bg-slate-750 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-300 ${
                  storagePercentage > 90
                    ? 'bg-rose-500'
                    : storagePercentage > 75
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>

          {/* Card 3: Storage Available */}
          <div className="p-5 rounded-2xl bg-slate-850/70 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Storage</span>
              <FolderOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatBytes(stats.availableStorageBytes)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {100 - storagePercentage}% free quota remaining
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'document', label: 'Documents' },
            { id: 'image', label: 'Images' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'code', label: 'Code & Scripts' },
            { id: 'archive', label: 'Archives' },
            { id: 'video', label: 'Videos' },
            { id: 'audio', label: 'Audio' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Files List / Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading your cloud storage...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-850/40 border border-slate-800 rounded-2xl">
          <div className="p-4 rounded-2xl bg-slate-800/60 w-fit mx-auto text-slate-500 mb-3">
            <UploadCloud className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery || selectedCategory !== 'all'
              ? 'No matching files found'
              : 'Your vault is empty'}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search query or category filter.'
              : 'Upload documents, photos, audio, or archives up to 10 MB each.'}
          </p>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload File Now
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-850/60 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Uploaded Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-slate-800/40 transition group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <FileIcon
                        mimeType={file.file_type}
                        filename={file.original_filename}
                        className="w-4 h-4"
                      />
                      <span className="font-medium text-slate-200 group-hover:text-blue-400 transition truncate max-w-xs sm:max-w-md">
                        {file.original_filename}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-400 font-mono bg-slate-800/70 px-2 py-0.5 rounded border border-slate-750">
                      {file.file_type || 'Unknown'}
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
                        onClick={() => handleDownload(file)}
                        title="Download File"
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFileToDelete(file)}
                        title="Delete File"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="p-4 rounded-2xl bg-slate-850/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <FileIcon
                    mimeType={file.file_type}
                    filename={file.original_filename}
                    className="w-5 h-5"
                  />
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {formatBytes(file.file_size)}
                  </span>
                </div>
                <h4
                  title={file.original_filename}
                  className="font-medium text-sm text-slate-200 group-hover:text-blue-400 transition truncate mb-1"
                >
                  {file.original_filename}
                </h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(file.uploaded_at)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                  {file.file_type}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(file)}
                    title="Download"
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFileToDelete(file)}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!fileToDelete}
        onClose={() => !isDeleting && setFileToDelete(null)}
        title="Confirm File Deletion"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-white">
                "{fileToDelete?.original_filename}"
              </span>
              ? This will remove the file record and permanently purge the stored data from server disk.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setFileToDelete(null)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
