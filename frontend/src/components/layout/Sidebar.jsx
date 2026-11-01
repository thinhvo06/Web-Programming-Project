import React from 'react';
import { useNotes } from '../../context/NoteContext';
import {
  FileText,
  Users,
  Tag,
  Edit2,
  StickyNote,
  X
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const {
    notes,
    labels,
    activeFilter,
    setActiveFilter,
    setIsLabelManagerOpen
  } = useNotes();

  const totalNotesCount = notes.length;
  const sharedNotesCount = notes.filter((n) => Boolean(n.sharedBy)).length;

  const getLabelCount = (labelName) => {
    return notes.filter((n) => n.labels && n.labels.includes(labelName)).length;
  };

  const handleSelectFilter = (filterId) => {
    setActiveFilter(filterId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop trên màn hình nhỏ (Mobile/Tablet) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation:
          - Mobile: Drawer trượt từ mép trái, phủ 100% chiều cao (inset-y-0)
          - Desktop: Cố định sát mép trái (x=0), trải dài 100% từ dưới navbar xuống đáy màn hình
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-3 transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:h-full md:z-0 md:w-60 lg:w-64 md:shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header Drawer chỉ hiện trên Mobile/Tablet để dễ đóng */}
        <div className="flex md:hidden items-center justify-between pb-3 mb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 select-none">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <StickyNote className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">NoteApp</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nhóm điều hướng chính */}
        <div className="space-y-1 mb-3">
          <button
            onClick={() => handleSelectFilter('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className={`w-4 h-4 ${activeFilter === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
              <span>Tất cả ghi chú</span>
            </div>
            {totalNotesCount > 0 && (
              <span className="text-xs text-zinc-400 font-normal">
                {totalNotesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleSelectFilter('shared')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              activeFilter === 'shared'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className={`w-4 h-4 ${activeFilter === 'shared' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
              <span>Được chia sẻ</span>
            </div>
            {sharedNotesCount > 0 && (
              <span className="text-xs text-zinc-400 font-normal">
                {sharedNotesCount}
              </span>
            )}
          </button>
        </div>

        {/* Nhóm Nhãn cuộn mượt mà độc lập */}
        <div className="flex-1 overflow-y-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Nhãn
            </span>
            <button
              onClick={() => setIsLabelManagerOpen(true)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              title="Quản lý nhãn"
            >
              <span>Chỉnh sửa</span>
            </button>
          </div>

          <div className="space-y-0.5">
            {labels.map((lbl) => {
              const isActive = activeFilter === lbl.name;
              const count = getLabelCount(lbl.name);

              return (
                <button
                  key={lbl.id}
                  onClick={() => handleSelectFilter(lbl.name)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Tag className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <span className="truncate">{lbl.name}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs text-zinc-400 ml-2">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nút chân trang luôn ghim ở đáy sidebar */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setIsLabelManagerOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Chỉnh sửa & Thêm nhãn</span>
          </button>
        </div>
      </aside>
    </>
  );
}
