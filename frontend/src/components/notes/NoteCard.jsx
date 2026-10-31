import React from 'react';
import { useNotes } from '../../context/NoteContext';
import { NOTE_COLORS } from '../../services/mockData';
import { HighlightText } from '../common/HighlightText';
import {
  Pin,
  Lock,
  Users,
  Paperclip,
  Trash2,
  Share2
} from 'lucide-react';

export function NoteCard({ note }) {
  const {
    openEditNote,
    setNoteToDelete,
    togglePinNote,
    setNoteToShare,
    unlockedNoteIds,
    viewMode,
    debouncedSearchQuery
  } = useNotes();

  const isUnlocked = !note.isLocked || unlockedNoteIds.has(note.id);
  const colorObj = NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];

  const handleDelete = (e) => {
    e.stopPropagation();
    setNoteToDelete(note);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setNoteToShare(note);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ================= 1. VIEW DẠNG DANH SÁCH (LIST VIEW - TIÊU CHÍ 9) =================
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => openEditNote(note)}
        className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${colorObj.bgLight} ${colorObj.bgDark} ${colorObj.border}`}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            {/* TIÊU CHÍ 18: Biểu tượng trạng thái đặc biệt: Ghim, Khóa, Được chia sẻ */}
            {note.isPinned && (
              <span title="Đã ghim" className="text-zinc-600 dark:text-zinc-400">
                <Pin className="w-3.5 h-3.5 fill-current" />
              </span>
            )}
            {note.isLocked && (
              <span title="Ghi chú bảo mật" className="text-zinc-500">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
            {(note.sharedBy || (note.sharedWith && note.sharedWith.length > 0)) && (
              <span title="Được chia sẻ" className="text-blue-600 dark:text-blue-400">
                <Users className="w-3.5 h-3.5" />
              </span>
            )}

            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
              <HighlightText text={note.title || 'Ghi chú không tiêu đề'} query={debouncedSearchQuery} />
            </h3>
          </div>

          {!isUnlocked ? (
            <p className="text-xs text-zinc-400 italic">
              Ghi chú đã bị khóa mật khẩu. Nhấp để mở.
            </p>
          ) : (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
              <HighlightText text={note.content || 'Không có nội dung'} query={debouncedSearchQuery} />
            </p>
          )}

          {/* Nhãn và người chia sẻ */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {note.sharedBy && (
              <span className="text-[11px] bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.2 rounded font-medium">
                Từ: {note.sharedBy.name || note.sharedBy.email}
              </span>
            )}
            {note.labels &&
              note.labels.map((lbl, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded"
                >
                  #{lbl}
                </span>
              ))}
            {note.attachments && note.attachments.length > 0 && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {note.attachments.length} tệp
              </span>
            )}
          </div>
        </div>

        {/* Cột thao tác */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
          <span className="text-xs text-zinc-400">
            {formatDate(note.updatedAt || note.createdAt)}
          </span>

          <div className="flex items-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => togglePinNote(note.id, e)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
              title={note.isPinned ? 'Bỏ ghim' : 'Ghim'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 text-zinc-400 hover:text-blue-600 rounded"
              title="Chia sẻ"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-zinc-400 hover:text-red-600 rounded"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. VIEW DẠNG LƯỚI THẺ (GRID VIEW - TIÊU CHÍ 10) =================
  return (
    <div
      onClick={() => openEditNote(note)}
      className={`group relative flex flex-col justify-between p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${colorObj.bgLight} ${colorObj.bgDark} ${colorObj.border}`}
    >
      <div>
        {/* Header thẻ: Tiêu đề + Các icon trạng thái (Tiêu chí 18) */}
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {note.isLocked && (
                <span title="Ghi chú bảo mật" className="text-zinc-500">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
              {(note.sharedBy || (note.sharedWith && note.sharedWith.length > 0)) && (
                <span title="Được chia sẻ" className="text-blue-600 dark:text-blue-400">
                  <Users className="w-3.5 h-3.5" />
                </span>
              )}
              {note.sharedBy && (
                <span className="text-[10px] bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-medium truncate">
                  Từ: {note.sharedBy.name || note.sharedBy.email}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-snug line-clamp-2">
              <HighlightText text={note.title || 'Ghi chú không tiêu đề'} query={debouncedSearchQuery} />
            </h3>
          </div>

          <button
            onClick={(e) => togglePinNote(note.id, e)}
            className={`p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ${
              note.isPinned ? 'opacity-100 text-zinc-700 dark:text-zinc-200' : 'opacity-0 group-hover:opacity-100'
            }`}
            title={note.isPinned ? 'Bỏ ghim' : 'Ghim'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Nội dung ghi chú */}
        {!isUnlocked ? (
          <div className="py-4 text-center">
            <Lock className="w-4 h-4 mx-auto text-zinc-400 mb-1" />
            <p className="text-xs text-zinc-400">Đã khóa bằng mật khẩu</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap line-clamp-5 leading-relaxed mb-2.5">
              <HighlightText text={note.content || 'Không có nội dung'} query={debouncedSearchQuery} />
            </p>

            {/* Thumbnail ảnh đính kèm nếu có (Tiêu chí 15) */}
            {note.attachments && note.attachments.some((a) => a.type === 'image') && (
              <div className="mb-2.5 rounded overflow-hidden border border-black/5 dark:border-white/10 max-h-32">
                <img
                  src={note.attachments.find((a) => a.type === 'image').url}
                  alt="Ảnh đính kèm"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: Nhãn & Các nút thao tác */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10">
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.labels.map((lbl, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.2 rounded"
              >
                #{lbl}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>{formatDate(note.updatedAt || note.createdAt)}</span>

          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleShare}
              className="p-1 hover:text-blue-600 rounded"
              title="Chia sẻ"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:text-red-600 rounded"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
