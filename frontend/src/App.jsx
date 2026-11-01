import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useNotes } from './context/NoteContext';

import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ActivationBanner } from './components/layout/ActivationBanner';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { NotesFeed } from './components/notes/NotesFeed';

import { NoteEditorModal } from './components/notes/NoteEditorModal';
import { NotePasswordModal } from './components/notes/NotePasswordModal';
import { NoteShareModal } from './components/notes/NoteShareModal';
import { LabelManagerModal } from './components/notes/LabelManagerModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';

import { ProfileModal } from './components/profile/ProfileModal';
import { ChangePasswordModal } from './components/profile/ChangePasswordModal';
import { PreferencesModal } from './components/profile/PreferencesModal';
import { AuthPage } from './components/auth/AuthPage';

export function App() {
  const { isAuthenticated } = useAuth();
  const { noteToDelete, setNoteToDelete, confirmDeleteNote, openCreateNote, isEditorOpen } = useNotes();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Phím tắt toàn cục (Tiêu chí 29 UX Polish)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl + N hoặc Cmd + N để tạo ghi chú mới
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !isEditorOpen) {
        e.preventDefault();
        openCreateNote();
      }

      // Phím "/" để focus ô tìm kiếm khi không ở trong ô nhập liệu
      if (
        e.key === '/' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        !isEditorOpen
      ) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"][placeholder*="Tìm kiếm"]');
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openCreateNote, isEditorOpen]);

  // Chặn truy cập khi chưa đăng nhập (Tiêu chí 3: Auth Guard)
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors">
      {/* 1. Banner tài khoản chưa kích hoạt (Tiêu chí 2) */}
      <ActivationBanner />

      {/* 2. Banner trạng thái ngoại tuyến PWA (Tiêu chí 31) */}
      <OfflineBanner />

      {/* 3. Thanh điều hướng đầu trang (Navbar sát mép, full-width) */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenChangePassword={() => setIsChangePassOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
      />

      {/* 4. Khung giao diện chính (Sidebar sát mép trái, trải dài 100% xuống đáy) */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <NotesFeed />
        </main>
      </div>

      {/* 5. CÁC CỬA SỔ MODAL QUẢN LÝ (TIÊU CHÍ 11, 12, 13, 20, 23, 24, 25) */}
      {/* Form Tạo & Sửa note dùng chung 1 màn hình (QUY ĐỊNH ĐỎ) */}
      <NoteEditorModal />

      {/* Popup xác nhận khi xóa ghi chú (QUY ĐỊNH ĐỎ - Tiêu chí 13) */}
      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
        title="Xác nhận xóa ghi chú"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ghi chú "${noteToDelete?.title || 'không tiêu đề'}" không? Thao tác này sẽ không thể khôi phục.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        isDanger={true}
      />

      {/* Modal yêu cầu nhập mật khẩu cho note bị khóa (Tiêu chí 24) */}
      <NotePasswordModal />

      {/* Modal chia sẻ ghi chú (Tiêu chí 25) */}
      <NoteShareModal />

      {/* Modal CRUD Quản lý nhãn (Tiêu chí 20) */}
      <LabelManagerModal />

      {/* Modal thông tin & sửa avatar cá nhân (Tiêu chí 5, 6) */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Modal đổi mật khẩu tài khoản (Tiêu chí 7) */}
      <ChangePasswordModal isOpen={isChangePassOpen} onClose={() => setIsChangePassOpen(false)} />

      {/* Modal tùy chỉnh font chữ & giao diện (Tiêu chí 8) */}
      <PreferencesModal isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)} />
    </div>
  );
}

export default App;
