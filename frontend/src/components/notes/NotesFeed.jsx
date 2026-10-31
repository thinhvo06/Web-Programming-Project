import React from 'react';
import { useNotes } from '../../context/NoteContext';
import { NoteCard } from './NoteCard';
import { NOTE_COLORS } from '../../services/mockData';
import {
  FileText,
  Search,
  Users,
  Tag,
  Plus,
  ArrowUpDown,
  Filter
} from 'lucide-react';

export function NotesFeed() {
  const {
    pinnedNotes,
    otherNotes,
    totalFilteredCount,
    viewMode,
    activeFilter,
    selectedColorFilter,
    setSelectedColorFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    openCreateNote
  } = useNotes();

  const isSearching = Boolean(searchQuery.trim());

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Ô KÍCH HOẠT TẠO GHI CHÚ MỚI (Form tạo/sửa dùng chung 1 màn hình - Tiêu chí 11 & 12) */}
      <div className="max-w-xl mx-auto">
        <div
          onClick={openCreateNote}
          className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-xs hover:shadow-sm cursor-pointer transition-shadow"
        >
          <span className="text-sm text-zinc-500 dark:text-zinc-400 font-normal">
            Tạo ghi chú mới...
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-600 font-mono">
              Ctrl+N
            </span>
            <div className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
              <Plus className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* THANH BỘ LỌC MÀU SẮC & SẮP XẾP (Tiêu chí 8, 9, 10, 19) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs">
        {/* Tiêu đề & Danh mục */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilter === 'all' && (
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Tất cả ghi chú</span>
            </h2>
          )}
          {activeFilter === 'shared' && (
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Được chia sẻ với tôi</span>
            </h2>
          )}
          {activeFilter !== 'all' && activeFilter !== 'shared' && (
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Nhãn: #{activeFilter}</span>
            </h2>
          )}

          <span className="text-xs text-zinc-400 font-normal">
            ({totalFilteredCount})
          </span>

          {isSearching && (
            <span className="text-xs text-zinc-500 ml-2">
              Tìm: <strong>"{searchQuery}"</strong>{' '}
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:underline ml-1"
              >
                (Xóa)
              </button>
            </span>
          )}
        </div>

        {/* Cụm Lọc theo Màu sắc & Sắp xếp */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Lọc theo màu (Tiêu chí 8) */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-400 text-[11px] hidden sm:inline">Màu:</span>
            <button
              onClick={() => setSelectedColorFilter('all')}
              className={`px-1.5 py-0.5 rounded text-[11px] border transition-colors ${
                selectedColorFilter === 'all'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-medium'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
              }`}
              title="Tất cả màu"
            >
              Tất cả
            </button>
            <div className="flex items-center gap-1 ml-0.5">
              {NOTE_COLORS.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setSelectedColorFilter(selectedColorFilter === c.id ? 'all' : c.id)
                  }
                  className={`w-4 h-4 rounded-full border transition-transform ${c.bgLight} ${
                    selectedColorFilter === c.id ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : ''
                  }`}
                  title={`Lọc màu ${c.label}`}
                />
              ))}
            </div>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="updated">Mới cập nhật</option>
              <option value="created">Mới tạo</option>
              <option value="title">Tiêu đề (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* TRẠNG THÁI RỖNG (EMPTY STATE) */}
      {totalFilteredCount === 0 && (
        <div className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
            {isSearching ? <Search className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isSearching
              ? 'Không tìm thấy ghi chú nào phù hợp'
              : selectedColorFilter !== 'all'
              ? 'Không có ghi chú nào màu này'
              : 'Chưa có ghi chú nào trong mục này'}
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {isSearching
              ? 'Thử tìm với từ khóa khác trong tiêu đề hoặc nội dung.'
              : 'Nhấp vào "Tạo ghi chú mới..." ở trên để thêm ghi chú.'}
          </p>
        </div>
      )}

      {/* PHẦN 1: GHI CHÚ ĐÃ GHIM (TIÊU CHÍ 17 & 18) */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1">
            Đã ghim ({pinnedNotes.length})
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
                : 'space-y-2'
            }
          >
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* PHẦN 2: CÁC GHI CHÚ KHÁC */}
      {otherNotes.length > 0 && (
        <div className="space-y-2">
          {pinnedNotes.length > 0 && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1 pt-2">
              Khác ({otherNotes.length})
            </div>
          )}

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
                : 'space-y-2'
            }
          >
            {otherNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
