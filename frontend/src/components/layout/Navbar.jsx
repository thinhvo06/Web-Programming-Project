import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotes } from '../../context/NoteContext';
import { useTheme } from '../../context/ThemeContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Avatar } from '../common/Avatar';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Sun,
  Moon,
  Menu,
  User,
  KeyRound,
  Sliders,
  LogOut,
  StickyNote
} from 'lucide-react';

export function Navbar({ onToggleSidebar, onOpenProfile, onOpenChangePassword, onOpenPreferences }) {
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery, viewMode, setViewMode } = useNotes();
  const { theme, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo & Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <StickyNote className="w-4 h-4" />
            </div>
            <span className="font-bold text-zinc-800 dark:text-zinc-100 text-base">
              NoteApp
            </span>
          </div>
        </div>

        {/* Thanh tìm kiếm Live Search (Tiêu chí 19: Tìm kiếm không có nút Search, delay 300ms) */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong tiêu đề và nội dung..."
              className="w-full pl-9 pr-8 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900 rounded-md text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cụm công cụ bên phải */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Nút Grid / List View (Tiêu chí 9, 10) */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
              title="Xem dạng lưới (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
              title="Xem dạng danh sách (List)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Nút Light / Dark mode (Tiêu chí 8) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Trạng thái mạng Offline / Online */}
          {!isOnline && (
            <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded">
              Offline
            </span>
          )}

          {/* User Profile Dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-1 hover:ring-zinc-300 dark:hover:ring-zinc-700"
              aria-label="Tài khoản"
            >
              <Avatar src={user?.avatar} name={user?.displayName || 'User'} size="sm" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-md py-1 z-50">
                <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {user?.displayName || 'Chưa đặt tên'}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1 text-xs text-zinc-700 dark:text-zinc-300">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>Thông tin cá nhân & Avatar</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenChangePassword();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
                  >
                    <KeyRound className="w-4 h-4 text-zinc-400" />
                    <span>Đổi mật khẩu tài khoản</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenPreferences();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
                  >
                    <Sliders className="w-4 h-4 text-zinc-400" />
                    <span>Cài đặt cỡ chữ & giao diện</span>
                  </button>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left text-xs font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
