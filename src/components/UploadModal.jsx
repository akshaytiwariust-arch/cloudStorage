import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatBytes } from '../utils/formatters';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit in bytes

export default function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleFiles = (incomingFiles) => {
    const validList = [];
    let hasOversized = false;

    Array.from(incomingFiles).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        hasOversized = true;
        toast.error(`"${file.name}" exceeds the 10 MB limit (${formatBytes(file.size)}). It was rejected.`);
      } else {
        validList.push(file);
      }
    });

    if (validList.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validList]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFileFromQueue = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Files uploaded successfully!');
        setSelectedFiles([]);
        setUploadProgress(100);
        if (onUploadComplete) onUploadComplete();
        setTimeout(() => {
          onClose();
          setUploading(false);
          setUploadProgress(0);
        }, 600);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'File upload failed. Please try again.';
      toast.error(errMsg);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => !uploading && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Upload Files</h3>
              <p className="text-xs text-slate-400">Limit: 10 MB per individual file</p>
            </div>
          </div>
          {!uploading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <div className="p-4 rounded-full bg-slate-800 text-blue-400 mb-3 group-hover:scale-110 transition">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Drag & drop files here, or <span className="text-blue-400 underline">browse</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports all file types (Images, Documents, Audio, Video, Archives). Max 10 MB each.
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>Selected Files ({selectedFiles.length})</span>
              <span>
                Total Size:{' '}
                {formatBytes(selectedFiles.reduce((acc, curr) => acc + curr.size, 0))}
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-2.5 bg-slate-800/70 border border-slate-750 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <File className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-slate-200 truncate font-medium text-xs">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 bg-slate-700/60 px-1.5 py-0.5 rounded">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => removeFileFromQueue(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                Uploading files to server...
              </span>
              <span className="text-blue-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={selectedFiles.length === 0 || uploading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
