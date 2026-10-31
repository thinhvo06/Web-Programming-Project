# 🐘 HƯỚNG DẪN CÀI ĐẶT & CHẠY BACK-END PHP THUẦN (XAMPP)

## 📌 THÔNG TIN DỰ ÁN
- **Môn học:** 503073 – Lập trình & Ứng dụng Web (Đại học Tôn Đức Thắng)
- **Đề tài:** Ứng dụng Quản lý Ghi chú (Note App)
- **Công nghệ Back-End:** **PHP thuần (Core / Vanilla PHP) + MySQL (PDO)**

---

## 🚀 CÁC BƯỚC KHỞI CHẠY BẰNG XAMPP

### Bước 1: Copy thư mục code vào XAMPP
Copy toàn bộ thư mục `backend-php` vào thư mục web của XAMPP:
`C:\xampp\htdocs\backend-php`

### Bước 2: Khởi động XAMPP Control Panel
- Bật module **Apache** (Cổng 80)
- Bật module **MySQL** (Cổng 3306)

### Bước 3: Nạp cơ sở dữ liệu (Import database.sql)
1. Mở trình duyệt truy cập: `http://localhost/phpmyadmin`
2. Tạo database mới tên: `tdtu_note_app` (Bảng mã: `utf8mb4_unicode_ci`)
3. Chọn database vừa tạo, nhấn tab **Import (Nhập)** -> Chọn file **`database.sql`** trong thư mục `backend-php` -> Nhấn **Go (Thực hiện)**.
*(Toàn bộ bảng dữ liệu và 3 tài khoản demo có sẵn ghi chú, nhãn, ghim, khóa sẽ được nạp tự động).*

### Bước 4: Kiểm tra API hoạt động
Truy cập trên trình duyệt: `http://localhost/backend-php/index.php`  
Nếu xuất hiện JSON `{"success": true, "message": "TDTU Note App - Pure PHP RESTful Backend API", ...}` là backend đã chạy thành công 100%!

---

## ⚡ (TÙY CHỌN) CHẠY WEBSOCKET CỘNG TÁC THỜI GIAN THỰC (TIÊU CHÍ 26)
Để demo tính năng gõ chữ đồng thời giữa nhiều người:
1. Mở terminal tại `backend-php/realtime-socket`
2. Chạy:
   ```bash
   npm install
   npm start
   ```
Server WebSocket sẽ lắng nghe tại cổng `5001`.

---

## 🔑 DANH SÁCH TÀI KHOẢN KIỂM THỬ DEMO (RUBRIC)

1. **Tài khoản chính (Chủ sở hữu ghi chú):**
   - Email: `student1@tdtu.edu.vn`
   - Mật khẩu: `password123`
   - *Có sẵn 6 ghi chú: 2 note ghim lên đầu (sắp theo thời gian ghim), 1 note khóa pass (`note123456`), 2 note chia sẻ cho student2.*

2. **Tài khoản cộng tác viên:**
   - Email: `student2@tdtu.edu.vn`
   - Mật khẩu: `password123`
   - *Kiểm tra mục "Shared with me" (1 note quyền Edit để test realtime, 1 note quyền Read-only).*

3. **Tài khoản chưa kích hoạt:**
   - Email: `unverified@tdtu.edu.vn`
   - Mật khẩu: `password123`
   - *Để FE test Banner cảnh báo màu vàng/đỏ. Link kích hoạt:*  
     `http://localhost/backend-php/api/auth/activate.php?token=demo-activation-token-tdtu-2026`

---

## 📡 DANH SÁCH URL API PHÍA FRONT-END GỌI ĐẾN:

Base URL: `http://localhost/backend-php/api`

| Chức năng | Phương thức & URL | Ghi chú |
| :--- | :--- | :--- |
| **Đăng ký** | `POST /auth/register.php` | Bcrypt hash, auto-login, gửi mail |
| **Đăng nhập** | `POST /auth/login.php` | Cấp JWT Token |
| **Đăng xuất** | `POST /auth/logout.php` | Xóa token phía client |
| **Kích hoạt** | `GET /auth/activate.php?token=...` | Kích hoạt và tắt banner |
| **Quên mật khẩu** | `POST /auth/forgot-password.php` | Gửi mã OTP 6 số |
| **Xác thực OTP** | `POST /auth/verify-otp.php` | Kiểm tra mã OTP |
| **Đặt lại mật khẩu** | `POST /auth/reset-password.php` | Cập nhật pass mới (bắt login lại) |
| **Xem Profile** | `GET /users/profile.php` | Trả về info + avatar |
| **Đổi Profile** | `POST /users/profile.php` | Đổi tên & upload ảnh avatar |
| **Đổi mật khẩu user** | `POST /users/change-password.php` | Kiểm tra pass cũ |
| **Tùy biến UI** | `GET` & `POST /users/preferences.php` | Cỡ font, màu sắc, Dark/Light |
| **Danh sách Note** | `GET /notes/index.php` | Có `?search=...` & `?labelId=...`, ghim lên đầu |
| **Tạo Note** | `POST /notes/index.php` | Chỉ cần Title & Content |
| **Xem / Sửa / Xóa** | `GET` / `PUT` / `DELETE /notes/detail.php?id=...` | Sửa dùng cho Auto-save, xóa popup confirm |
| **Ghim note** | `POST /notes/pin.php?id=...` | Ghim / Bỏ ghim |
| **Khóa note** | `POST /notes/lock.php?id=...` | Bật mật khẩu riêng cho note |
| **Mở khóa note** | `POST /notes/unlock.php?id=...` | Nhập pass để xem nội dung |
| **Tắt khóa note** | `POST /notes/disable-lock.php?id=...` | Nhập pass cũ để tắt |
| **Đổi pass note** | `POST /notes/change-password.php?id=...`| Nhập pass cũ + pass mới 2 lần |
| **CRUD Nhãn** | `GET` & `POST /labels/index.php`, `PUT` & `DELETE /labels/detail.php?id=...` | Xóa nhãn không mất note |
| **Gắn nhãn note** | `POST /labels/attach.php?noteId=...` | Gắn nhãn nhanh |
| **Chia sẻ note** | `POST /shares/share.php?noteId=...` | Nhập email, chọn Read/Edit, gửi mail |
| **Shared with me** | `GET /shares/shared-with-me.php` | Mục riêng các note được chia sẻ |
| **Quản lý chia sẻ** | `PUT` & `DELETE /shares/manage-share.php?shareId=...`| Đổi quyền Read<=>Edit, thu hồi |
| **Upload file** | `POST /attachments/upload.php?noteId=...` | Upload ảnh, video, tài liệu |
| **Tải file** | `GET /attachments/download.php?id=...` | Tải file đính kèm |
