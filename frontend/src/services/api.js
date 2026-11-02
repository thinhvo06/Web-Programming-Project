// Đồng bộ 100% theo tài liệu bàn giao Backend (API & Socket Contract) của bạn BE
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

function getAuthHeader() {
  const token = localStorage.getItem('noteapp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // ================= 1. XÁC THỰC (AUTH) =================
  async register({ email, displayName, password }) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          display_name: displayName,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
      return {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.display_name,
          avatar: data.user.avatar_url,
          isActivated: Boolean(data.user.is_activated)
        }
      };
    }
    // Mock simulation
    await new Promise((r) => setTimeout(r, 300));
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'usr-' + Date.now(),
        email,
        displayName,
        avatar: '',
        isActivated: false,
        preferences: { fontSize: 'medium', theme: 'light', defaultColor: 'default' }
      }
    };
  },

  async login({ email, password }) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sai email hoặc mật khẩu');
      return {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.display_name,
          avatar: data.user.avatar_url,
          isActivated: Boolean(data.user.is_activated)
        }
      };
    }
    await new Promise((r) => setTimeout(r, 300));
    return {
      token: 'mock-jwt-token-active',
      user: {
        id: 'usr-001',
        email,
        displayName: email.split('@')[0],
        avatar: '',
        isActivated: email !== 'unverified@tdtu.edu.vn',
        preferences: { fontSize: 'medium', theme: 'light', defaultColor: 'default' }
      }
    };
  },

  async activateAccount(token = 'sample-token') {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/auth/activate/${token}`, {
        headers: getAuthHeader()
      });
      return res.json();
    }
    await new Promise((r) => setTimeout(r, 200));
    return { success: true, message: 'Kích hoạt tài khoản thành công!' };
  },

  async forgotPassword(email) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không tìm thấy tài khoản');
      return data;
    }
    await new Promise((r) => setTimeout(r, 300));
    return { success: true, message: 'Mã xác thực OTP đã được gửi về email (Mã mẫu test: 123456)' };
  },

  async resetPassword({ email, otp, newPassword }) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
      return data;
    }
    await new Promise((r) => setTimeout(r, 300));
    if (otp !== '123456' && otp.length !== 6) {
      throw new Error('Mã OTP không đúng (thử mã mẫu: 123456)');
    }
    return { success: true, message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' };
  },

  // ================= 2. PROFILE & CÀI ĐẶT =================
  async updateProfile(userId, { displayName, avatarFile, avatar }) {
    if (!USE_MOCK) {
      const formData = new FormData();
      formData.append('display_name', displayName);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (avatar && avatar.startsWith('data:image/')) {
        formData.append('avatar', avatar);
      }

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cập nhật thông tin thất bại');
      return data;
    }
    return { displayName };
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mật khẩu hiện tại không đúng');
      return data;
    }
    await new Promise((r) => setTimeout(r, 200));
    return { success: true, message: 'Đổi mật khẩu thành công' };
  },

  async updatePreferences(userId, preferences) {
    if (!USE_MOCK) {
      await fetch(`${API_BASE_URL}/users/preferences`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
    }
    return preferences;
  },

  // ================= 3. GHI CHÚ (NOTES) =================
  async getNotes(params = {}) {
    if (!USE_MOCK) {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/notes?${query}`, {
        headers: getAuthHeader()
      });
      return res.json();
    }
    return null;
  },

  async createNote(noteData) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      return res.json();
    }
    return noteData;
  },

  async updateNote(id, noteData) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      return res.json();
    }
    return noteData;
  },

  async deleteNote(id, password = null) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return res.json();
    }
    return { success: true };
  },

  async togglePin(id) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/notes/${id}/pin`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      return res.json();
    }
    return { success: true };
  },

  // ================= 4. KHÓA MẬT KHẨU NOTE =================
  async lockNote(id, password) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/notes/${id}/lock`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm_password: password })
      });
      return res.json();
    }
    return { success: true };
  },

  async unlockNote(id, password) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/notes/${id}/unlock`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sai mật khẩu');
      return data;
    }
    return { success: true };
  },

  async disableLock(id, currentPassword) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/notes/${id}/disable-lock`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mật khẩu không đúng');
      return data;
    }
    return { success: true };
  },

  // ================= 5. CHIA SẺ NOTE =================
  async shareNote(id, email, permission = 'read') {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/shares/notes/${id}/share`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permission })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể chia sẻ ghi chú');
      }
      return data;
    }
    return { success: true };
  },

  async revokeShare(shareId) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/shares/${shareId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return res.json();
    }
    return { success: true };
  },

  async revokeShareByEmail(noteId, email) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/shares/notes/${noteId}/share`, {
        method: 'DELETE',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể thu hồi quyền chia sẻ');
      }
      return data;
    }
    return { success: true };
  },

  async getSharedWithMe() {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/shares/shared-with-me`, {
        headers: getAuthHeader()
      });
      return res.json();
    }
    return [];
  },

  // ================= 6. NHÃN (LABELS) =================
  async getLabels() {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/labels`, {
        headers: getAuthHeader()
      });
      return res.json();
    }
    return { labels: [] };
  },

  async createLabel(name) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/labels`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return res.json();
    }
    return { label: { id: Date.now(), name } };
  },

  async renameLabel(id, name) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/labels/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return res.json();
    }
    return { label: { id, name } };
  },

  async deleteLabel(id) {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/labels/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return res.json();
    }
    return { success: true };
  }
};
