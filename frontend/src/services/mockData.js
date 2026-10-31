// Dữ liệu mẫu khởi tạo chuẩn đồ án (phong cách thực tế, không dùng màu neon AI)
export const INITIAL_USER = {
  id: 'usr-001',
  email: 'hoangnam@student.tdtu.edu.vn',
  displayName: 'Nguyễn Hoàng Nam',
  avatar: '', // Mặc định rỗng để kiểm thử Avatar chữ cái đầu (Tiêu chí 5)
  isActivated: false, // Mặc định false để hiển thị Banner thông báo kích hoạt (Tiêu chí 2)
  preferences: {
    fontSize: 'medium', // small | medium | large
    theme: 'light',
    defaultColor: 'default',
  },
};

export const INITIAL_LABELS = [
  { id: 'lbl-1', name: 'Môn học Web' },
  { id: 'lbl-2', name: 'Đồ án cuối kỳ' },
  { id: 'lbl-3', name: 'Việc cần làm' },
  { id: 'lbl-4', name: 'Cá nhân' },
];

export const INITIAL_NOTES = [
  {
    id: 'note-001',
    userId: 'usr-001',
    title: 'Kế hoạch hoàn thành đồ án Web',
    content: '- Hoàn thành giao diện Front-end trước ngày 31/10.\n- Kiểm tra đủ 32 tiêu chí Rubric trong đề bài.\n- Bắt buộc: Form Tạo & Sửa chung 1 màn hình, tự động lưu không có nút Lưu.\n- Họp cùng thành viên Backend để ghép API và chuẩn bị kịch bản quay video demo.',
    color: 'yellow',
    isPinned: true,
    pinnedAt: '2026-10-31T08:30:00.000Z',
    labels: ['Môn học Web', 'Đồ án cuối kỳ'],
    password: null,
    isLocked: false,
    sharedWith: [
      { email: 'thanhvien2@student.tdtu.edu.vn', permission: 'edit' }
    ],
    sharedBy: null,
    attachments: [
      {
        id: 'att-1',
        name: 'rubric_cham_diem.pdf',
        type: 'file',
        size: '1.2 MB',
        url: '#'
      }
    ],
    createdAt: '2026-10-30T14:00:00.000Z',
    updatedAt: '2026-10-31T09:15:00.000Z',
  },
  {
    id: 'note-002',
    userId: 'usr-001',
    title: 'Mật khẩu tài khoản & Thông tin phòng trọ (Đã khóa)',
    content: 'Số tài khoản VCB: 1029384756 - Nguyen Hoang Nam\nMật khẩu wifi phòng: phongtro2026@\n(Mật khẩu mở khóa note này là: 123)',
    color: 'rose',
    isPinned: true,
    pinnedAt: '2026-10-31T08:45:00.000Z',
    labels: ['Cá nhân'],
    password: '123',
    isLocked: true,
    sharedWith: [],
    sharedBy: null,
    attachments: [],
    createdAt: '2026-10-29T10:00:00.000Z',
    updatedAt: '2026-10-30T16:20:00.000Z',
  },
  {
    id: 'note-003',
    userId: 'usr-001',
    title: 'Danh sách đồ dùng cần mua',
    content: '1. Tập vở kẻ ngang A4\n2. Bút bi xanh ngòi 0.5mm\n3. Cáp sạc type C dự phòng\n4. Bánh mì sandwich và sữa chua ăn sáng',
    color: 'default',
    isPinned: false,
    pinnedAt: null,
    labels: ['Việc cần làm', 'Cá nhân'],
    password: null,
    isLocked: false,
    sharedWith: [],
    sharedBy: null,
    attachments: [],
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-29T11:00:00.000Z',
  },
  {
    id: 'note-004',
    userId: 'usr-002',
    title: 'Quy chuẩn kết nối API Backend & WebSocket',
    content: 'Gửi bạn Frontend cấu hình API:\n- Endpoint Auth: /api/auth/register, /api/auth/login\n- Endpoint Note: GET/POST/PUT/DELETE /api/notes\n- Socket room: join_note { noteId, user } để cập nhật realtime.',
    color: 'blue',
    isPinned: false,
    pinnedAt: null,
    labels: ['Đồ án cuối kỳ'],
    password: null,
    isLocked: false,
    sharedWith: [
      { email: 'hoangnam@student.tdtu.edu.vn', permission: 'edit' }
    ],
    sharedBy: {
      email: 'thanhvien2@student.tdtu.edu.vn',
      name: 'Trần Văn Bình (BE)',
      date: '31/10/2026',
      permission: 'edit'
    },
    attachments: [
      {
        id: 'att-2',
        name: 'database_erd.png',
        type: 'image',
        size: '340 KB',
        url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80'
      }
    ],
    createdAt: '2026-10-31T07:00:00.000Z',
    updatedAt: '2026-10-31T08:00:00.000Z',
  },
  {
    id: 'note-005',
    userId: 'usr-003',
    title: 'Lưu ý khi quay video demo và vấn đáp',
    content: '- Video tối thiểu 1080p, quay rõ mặt và giọng nói của cả hai bạn.\n- Lần lượt demo đủ các tiêu chí từ 1 đến 32 trong Rubric.\n- Mỗi thành viên chuẩn bị sẵn máy để trả lời câu hỏi vấn đáp trực tiếp của thầy cô.',
    color: 'green',
    isPinned: false,
    pinnedAt: null,
    labels: ['Môn học Web'],
    password: null,
    isLocked: false,
    sharedWith: [
      { email: 'hoangnam@student.tdtu.edu.vn', permission: 'read' }
    ],
    sharedBy: {
      email: 'giangvien@tdtu.edu.vn',
      name: 'Thầy Hướng Dẫn',
      date: '28/10/2026',
      permission: 'read'
    },
    attachments: [],
    createdAt: '2026-10-28T08:00:00.000Z',
    updatedAt: '2026-10-28T08:00:00.000Z',
  }
];

// Bảng màu ghi chú tinh tế chuẩn phong cách Google Keep (không loè loẹt kiểu AI)
export const NOTE_COLORS = [
  {
    id: 'default',
    label: 'Mặc định',
    hex: '#ffffff',
    bgLight: 'bg-white',
    bgDark: 'dark:bg-zinc-900',
    border: 'border-zinc-200 dark:border-zinc-800'
  },
  {
    id: 'yellow',
    label: 'Vàng nhạt',
    hex: '#fff9c4',
    bgLight: 'bg-[#fffde7]',
    bgDark: 'dark:bg-[#2b2716]',
    border: 'border-[#fff59d] dark:border-[#524925]'
  },
  {
    id: 'green',
    label: 'Xanh nhạt',
    hex: '#e8f5e9',
    bgLight: 'bg-[#f1f8e9]',
    bgDark: 'dark:bg-[#1b2b1c]',
    border: 'border-[#c5e1a5] dark:border-[#2f5232]'
  },
  {
    id: 'blue',
    label: 'Xanh trời',
    hex: '#e3f2fd',
    bgLight: 'bg-[#e8f4fd]',
    bgDark: 'dark:bg-[#162736]',
    border: 'border-[#b3e5fc] dark:border-[#204461]'
  },
  {
    id: 'purple',
    label: 'Tím nhạt',
    hex: '#f3e5f5',
    bgLight: 'bg-[#f8f0fb]',
    bgDark: 'dark:bg-[#2a1d2e]',
    border: 'border-[#e1bee7] dark:border-[#4d2f54]'
  },
  {
    id: 'rose',
    label: 'Hồng nhạt',
    hex: '#fce4ec',
    bgLight: 'bg-[#fdf0f4]',
    bgDark: 'dark:bg-[#301c22]',
    border: 'border-[#f8bbd0] dark:border-[#572935]'
  },
  {
    id: 'orange',
    label: 'Cam nhạt',
    hex: '#fff3e0',
    bgLight: 'bg-[#fff8f0]',
    bgDark: 'dark:bg-[#302216]',
    border: 'border-[#ffe0b2] dark:border-[#573a21]'
  },
  {
    id: 'slate',
    label: 'Xám sáng',
    hex: '#f5f5f5',
    bgLight: 'bg-[#f5f5f5]',
    bgDark: 'dark:bg-[#212121]',
    border: 'border-[#e0e0e0] dark:border-[#424242]'
  },
];
