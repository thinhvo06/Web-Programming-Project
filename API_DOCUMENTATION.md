# 📘 TÀI LIỆU BÀN GIAO BACK-END CHO FRONT-END (API & SOCKET CONTRACT)
**Dự án:** Ứng dụng Quản lý Ghi chú (Note App) - Môn Lập trình & Ứng dụng Web (503073)  
**Phụ trách BE:** Thành viên 2 (Back-end, CSDL & DevOps)  
**Dành cho:** Thành viên 1 (Front-end, UI/UX & PWA Offline)

---

## ⚡ 1. HƯỚNG DẪN BẠN FE KHỞI ĐỘNG BACKEND TRÊN MÁY LOCAL
FE chỉ cần mở terminal và chạy 3 dòng lệnh sau là Backend và toàn bộ dữ liệu mẫu sẵn sàng:
```bash
cd backend
npm install
npm run seed     # Khởi tạo CSDL SQLite + nạp sẵn tài khoản test và ghi chú mẫu
npm start        # Khởi động server tại http://localhost:5000
```
- **Base REST API URL:** `http://localhost:5000/api`
- **WebSocket URL (Socket.io):** `http://localhost:5000`
- **File đính kèm & Avatar URL:** `http://localhost:5000<đường_dẫn>` (ví dụ: `http://localhost:5000/uploads/avatars/...`)

---

## 🔑 2. TÀI KHOẢN TEST CÓ SẴN DATA (ĐỂ TEST GIAO DIỆN)

| Email | Mật khẩu | Mục đích kiểm thử giao diện FE |
| :--- | :--- | :--- |
| `student1@tdtu.edu.vn` | `password123` | **Tài khoản chính:** Có sẵn 2 note ghim lên đầu, 1 note khóa (mật khẩu note: `note123456`), 2 note đã chia sẻ, các nhãn. |
| `student2@tdtu.edu.vn` | `password123` | **Tài khoản cộng tác:** Mở mục **"Shared with me"** thấy 2 note (1 note quyền Edit để test Socket realtime gõ chữ chung, 1 note quyền Read-only). |
| `unverified@tdtu.edu.vn`| `password123` | **Tài khoản chưa kích hoạt:** Để test **Banner cảnh báo màu vàng/đỏ** ở đầu trang. Link test kích hoạt: `http://localhost:5000/api/auth/activate/demo-activation-token-tdtu-2026` |

---

## ⚙️ 3. CẤU HÌNH BIẾN MÔI TRƯỜNG PHÍA FRONT-END (`.env`)
Trong thư mục source React / Vite của bạn FE, tạo file `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📡 4. DANH SÁCH REST API CHI TIẾT THEO TỪNG MÀN HÌNH

> **Lưu ý chung:** Các API yêu cầu đăng nhập cần gửi Header:  
> `Authorization: Bearer <token_nhận_được_sau_login_hoặc_register>`

### A. MÀN HÌNH XÁC THỰC (AUTH)
#### 1. Đăng ký tài khoản (Tiêu chí 1)
- **POST** `/auth/register`
- **Body JSON:**
  ```json
  {
    "email": "user@tdtu.edu.vn",
    "display_name": "Nguyễn Văn A",
    "password": "password123"
  }
  ```
- **Response thành công (201):** *(Backend tự động login luôn, trả về token ngay)*
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "email": "user@tdtu.edu.vn",
      "display_name": "Nguyễn Văn A",
      "avatar_url": "/public/default-avatar.svg",
      "is_activated": false
    }
  }
  ```

#### 2. Kích hoạt tài khoản (Tiêu chí 2)
- **GET** `/auth/activate/:token`
- **Response (200):** Khi user click link email, gọi endpoint này để cập nhật `is_activated = true` và tắt banner trên FE.

#### 3. Đăng nhập (Tiêu chí 3)
- **POST** `/auth/login`
- **Body JSON:** `{ "email": "...", "password": "..." }`
- **Response (200):** Trả về `token` và thông tin `user`. FE lưu `token` vào `localStorage`.

#### 4. Đăng xuất (Tiêu chí 3)
- **POST** `/auth/logout` (FE xóa token khỏi `localStorage` và chuyển trang về login).

#### 5. Quên / Đặt lại mật khẩu (Tiêu chí 4)
- **Bước 1 (Gửi mã OTP):** **POST** `/auth/forgot-password`  
  Body: `{ "email": "student1@tdtu.edu.vn" }`
- **Bước 2 (Xác thực OTP):** **POST** `/auth/verify-reset-otp`  
  Body: `{ "email": "student1@tdtu.edu.vn", "otp": "123456" }`
- **Bước 3 (Đổi pass mới):** **POST** `/auth/reset-password`  
  Body: `{ "email": "student1@tdtu.edu.vn", "otp": "123456", "new_password": "password456" }`  
  *(Sau bước này chuyển user về trang đăng nhập để đăng nhập thủ công)*.

---

### B. MÀN HÌNH THÔNG TIN CÁ NHÂN & CÀI ĐẶT (PROFILE & SETTINGS)
#### 1. Xem thông tin cá nhân (Tiêu chí 5)
- **GET** `/users/profile`
- Trả về: `display_name`, `email`, `avatar_url` (nếu chưa upload, BE đã trả sẵn link ảnh mặc định).

#### 2. Đổi tên hiển thị & Upload avatar (Tiêu chí 6)
- **PUT** `/users/profile`
- **Content-Type:** `multipart/form-data`
- **FormData:**
  - `display_name` (string)
  - `avatar` (File ảnh JPG, PNG, WEBP, tối đa 5MB)

#### 3. Đổi mật khẩu (Tiêu chí 7)
- **PUT** `/users/change-password`
- **Body JSON:** `{ "current_password": "...", "new_password": "...", "confirm_password": "..." }`

#### 4. Tùy biến giao diện (Tiêu chí 8)
- **GET** `/users/preferences`
- **PUT** `/users/preferences`  
  Body: `{ "fontSize": "medium", "noteColor": "#fef08a", "theme": "dark" }`  
  *(fontSize gồm: 'small', 'medium', 'large'; theme gồm: 'light', 'dark')*

---

### C. MÀN HÌNH CHÍNH & QUẢN LÝ GHI CHÚ (NOTES & LABELS)

#### 1. Lấy danh sách ghi chú (Hỗ trợ Grid/List, Live Search & Lọc nhãn)
- **GET** `/notes`
- **Query Parameters:**
  - `search`: Từ khóa tìm kiếm (tìm cả tiêu đề và nội dung)
  - `labelId`: ID nhãn đang chọn (tìm kiếm kết hợp nhãn)
- **Đặc điểm Response:**
  - Note được ghim (`is_pinned: true`) luôn nằm trên cùng, sắp xếp theo thời gian ghim `pinned_at` mới nhất.
  - Mỗi note có cờ hiển thị icon nhận diện (Tiêu chí 18):
    - `is_pinned`: `true/false` (Hiển thị icon 📌)
    - `is_locked`: `true/false` (Hiển thị icon 🔒)
    - `is_shared`: `true/false` (Hiển thị icon 👥)
    - `user_role`: `'owner'` | `'edit'` | `'read'`

#### 2. Tạo ghi chú mới (Tiêu chí 11)
- **POST** `/notes`
- **Quy định đỏ:** Chỉ có `title` và `content` là bắt buộc nhập!
- **Body JSON:**
  ```json
  {
    "title": "Tiêu đề ghi chú",
    "content": "Nội dung ghi chú...",
    "color": "#fef08a",
    "is_pinned": false,
    "label_ids": [1, 2]
  }
  ```

#### 3. Sửa ghi chú & Auto-save (Tiêu chí 12 & 14)
- **PUT** hoặc **PATCH** `/notes/:id`
- **Quy định đỏ:** FE debounce gõ phím 300-500ms rồi tự động gửi request cập nhật ngầm, tuyệt đối không có nút Save!
- **Body JSON:** `{ "title": "...", "content": "...", "color": "...", "label_ids": [...] }`

#### 4. Xóa ghi chú (Tiêu chí 13)
- **DELETE** `/notes/:id`
- **Quy định đỏ:** Bắt buộc có Popup confirm trước khi xóa.
- Nếu note đang bị khóa, truyền kèm trong body: `{ "password": "..." }`

#### 5. Ghim / Bỏ ghim ghi chú (Tiêu chí 17)
- **PATCH** `/notes/:id/pin`

#### 6. Đính kèm tệp tin (Ảnh, Video, File PDF, Word, TXT, ZIP) (Tiêu chí 15 & 16)
- **Upload:** **POST** `/attachments/notes/:noteId`
  - Content-Type: `multipart/form-data`
  - FormData: `files` (chọn 1 hoặc nhiều file)
- **Tải file:** **GET** `/attachments/:id/download` (Mở trực tiếp link để tải)
- **Xóa file:** **DELETE** `/attachments/:id`

#### 7. Quản lý nhãn (Labels CRUD) (Tiêu chí 20, 21, 22)
- **GET** `/labels`: Lấy danh sách nhãn của user.
- **POST** `/labels`: Tạo nhãn `{ "name": "Công việc" }`
- **PUT** `/labels/:id`: Đổi tên nhãn `{ "name": "Việc cần làm" }` *(Tất cả note tự động cập nhật tên mới)*
- **DELETE** `/labels/:id`: Xóa nhãn *(Ghi chú vẫn giữ nguyên, chỉ xóa nhãn)*
- **POST** `/labels/notes/:noteId`: Gắn danh sách nhãn vào note `{ "label_ids": [1, 3] }`

---

### D. MÀN HÌNH BẢO VỆ MẬT KHẨU GHI CHÚ (TIÊU CHÍ 23 & 24)
- **Bật khóa mật khẩu:** **POST** `/notes/:id/lock`  
  Body: `{ "password": "abc", "confirm_password": "abc" }`
- **Mở khóa để xem/sửa (Unlock):** **POST** `/notes/:id/unlock`  
  Body: `{ "password": "abc" }`  
  *(Khi đúng mật khẩu, server trả về full nội dung ghi chú đã giải mã)*.
- **Tắt khóa bảo vệ:** **POST** `/notes/:id/disable-lock`  
  Body: `{ "current_password": "abc" }`
- **Đổi mật khẩu note:** **POST** `/notes/:id/change-lock-password`  
  Body: `{ "current_password": "abc", "new_password": "xyz", "confirm_password": "xyz" }`

---

### E. MÀN HÌNH CHIA SẺ GHI CHÚ & "SHARED WITH ME" (TIÊU CHÍ 25)
- **Chia sẻ note cho người khác:** **POST** `/shares/notes/:id/share`  
  Body: `{ "email": "student2@tdtu.edu.vn", "permission": "edit" }` *(permission gồm 'read' hoặc 'edit')*
- **Lấy danh sách ghi chú được chia sẻ ("Shared with me"):** **GET** `/shares/shared-with-me`  
  *(Trả về danh sách note, ai chia sẻ, ngày chia sẻ, và quyền read/edit)*.
- **Xem danh sách những người mình đã chia sẻ:** **GET** `/shares/notes/:id/shares`
- **Đổi quyền chia sẻ (Read <=> Edit):** **PUT** `/shares/shares/:shareId`  
  Body: `{ "permission": "read" }`
- **Thu hồi quyền chia sẻ:** **DELETE** `/shares/shares/:shareId`

---

## ⚡ 5. CODE MẪU WEBSOCKET SOCKET.IO CHO BẠN FE (TIÊU CHÍ 26)
Dành cho tính năng **Cộng tác sửa ghi chú Realtime nhiều người** trên note có quyền `edit`:

```javascript
import { io } from "socket.io-client";

// 1. Kết nối Socket kèm JWT token
const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token")
  }
});

// 2. Khi user mở màn hình Edit của noteId
socket.emit("join-note", { noteId: 1 });

// 3. Lắng nghe danh sách những người đang cùng mở note này
socket.on("room-users", ({ noteId, users }) => {
  console.log("Những người đang cùng xem/sửa note:", users);
  // Hiển thị danh sách avatar / tên cộng tác viên góc trên màn hình
});

// 4. Khi người dùng này gõ thay đổi title hoặc content -> phát lên server
function onContentChange(newTitle, newContent) {
  socket.emit("note-change", {
    noteId: 1,
    title: newTitle,
    content: newContent
  });
}

// 5. Lắng nghe khi người khác gõ để cập nhật nội dung tức thì trên màn hình
socket.on("note-updated", ({ noteId, title, content, updated_by }) => {
  // Cập nhật lại state của form editor trên giao diện
  console.log(`${updated_by.display_name} vừa chỉnh sửa:`, title, content);
});

// 6. Typing indicator / con trỏ chuột
socket.on("user-typing", ({ user, isTyping }) => {
  // Hiển thị thông báo "Nguyễn Văn A đang soạn thảo..."
});

// 7. Khi đóng modal / rời khỏi ghi chú
socket.emit("leave-note", { noteId: 1 });
```
