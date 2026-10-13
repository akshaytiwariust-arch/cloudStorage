import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  FileSpreadsheet,
  File as GenericFile,
} from 'lucide-react';
import { getFileCategory } from '../utils/formatters';

export default function FileIcon({ mimeType, filename, className = 'w-6 h-6' }) {
  const category = getFileCategory(mimeType, filename);

  switch (category) {
    case 'image':
      return (
        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
          <Image className={className} />
        </div>
      );
    case 'video':
      return (
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Video className={className} />
        </div>
      );
    case 'audio':
      return (
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Music className={className} />
        </div>
      );
    case 'pdf':
      return (
        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <FileText className={className} />
        </div>
      );
    case 'archive':
      return (
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
          <Archive className={className} />
        </div>
      );
    case 'code':
      return (
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Code className={className} />
        </div>
      );
    case 'document':
      return (
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <FileSpreadsheet className={className} />
        </div>
      );
    default:
      return (
        <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <GenericFile className={className} />
        </div>
      );
  }
}
