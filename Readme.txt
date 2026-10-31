================================================================================
ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN
BÁO CÁO HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG (README.TXT)
Môn học: 503073 – Lập trình & Ứng dụng Web | Học kỳ I / 2026-2027
Đề tài: Ứng dụng Quản lý Ghi chú (Note App)
Người thực hiện: Thành viên 2 (Back-end, CSDL & DevOps)
================================================================================

I. TỔNG QUAN HỆ THỐNG VÀ CÔNG NGHỆ BACK-END
--------------------------------------------------------------------------------
- Nền tảng: PHP thuần (Core / Vanilla PHP) theo đúng giáo trình chuẩn TDTU
- Cơ sở dữ liệu: MySQL 8.0 / MariaDB (Kết nối thông qua thư viện chuẩn PDO)
- Bảo mật cơ sở dữ liệu: 100% Prepared Statements (Chống hoàn toàn lỗi SQL Injection)
- Mã hóa mật khẩu: Bcrypt (Hàm chuẩn PHP password_hash và password_verify)
  + Băm mật khẩu tài khoản người dùng
  + Băm mật khẩu bảo vệ riêng biệt cho từng ghi chú (Tiêu chí 23 & 24)
- Cơ chế xác thực: JWT (JSON Web Token) tự xây dựng bằng PHP thuần (HMAC-SHA256)
- Xử lý tệp tin: Kiểm tra MIME type, dung lượng file avatar (< 5MB) và đa file đính kèm
- Dịch vụ Email & OTP: Gửi mail kích hoạt, cấp mã OTP 6 số khôi phục mật khẩu (hiệu lực 15 phút) và ghi nhật ký kiểm thử tại backend-php/logs/mail_logs.txt
- Cộng tác thời gian thực: WebSocket (Socket.io) chạy ngầm phục vụ Tiêu chí 26


II. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY ỨNG DỤNG (TRÊN XAMPP)
--------------------------------------------------------------------------------
Yêu cầu môi trường: Máy tính đã cài đặt XAMPP (Apache + MySQL).

BƯỚC 1: ĐẶT MÃ NGUỒN VÀO THƯ MỤC WEB CỦA XAMPP
- Copy thư mục `backend-php` vào thư mục `htdocs` của XAMPP:
  Đường dẫn: `C:\xampp\htdocs\backend-php`
  (Hoặc đặt trong thư mục gốc của web server).

BƯỚC 2: KHỞI ĐỘNG XAMPP CONTROL PANEL
- Mở XAMPP Control Panel.
- Nhấn "Start" ở module **Apache** (Cổng mặc định: 80).
- Nhấn "Start" ở module **MySQL** (Cổng mặc định: 3306).

BƯỚC 3: NẠP CƠ SỞ DỮ LIỆU VÀ DỮ LIỆU MẪU (IMPORT DATABASE)
- Mở trình duyệt web, truy cập: `http://localhost/phpmyadmin`
- Tạo một Cơ sở dữ liệu mới:
  + Tên CSDL: `tdtu_note_app`
  + Bảng mã: `utf8mb4_unicode_ci`
- Nhấn vào CSDL `tdtu_note_app` vừa tạo, chọn tab **"Import" (Nhập)**.
- Chọn file `database.sql` nằm trong thư mục `backend-php/database.sql`.
- Kéo xuống dưới cùng và nhấn **"Go" (Thực hiện)**.
  -> Toàn bộ cấu trúc bảng và 3 tài khoản demo có sẵn ghi chú mẫu sẽ được tạo tự động!

BƯỚC 4: KIỂM TRA MÁY CHỦ BACK-END
- Mở trình duyệt truy cập: `http://localhost/backend-php/index.php`
- Màn hình hiển thị JSON `{"success": true, "message": "TDTU Note App - Pure PHP RESTful Backend API", ...}` là hệ thống đã hoạt động hoàn hảo.
- Địa chỉ Base API để kết nối Front-End:
  👉 `http://localhost/backend-php/api`

BƯỚC 5 (TÙY CHỌN): CHẠY SERVER WEBSOCKET CỘNG TÁC REALTIME (TIÊU CHÍ 26)
- Để demo tính năng 2 người cùng gõ chữ trên 1 ghi chú:
  1. Mở cửa sổ Terminal/Command Prompt tại: `backend-php/realtime-socket`
  2. Chạy lệnh:
     npm install
     npm start
  3. Server WebSocket sẽ lắng nghe tại cổng `5001`.


III. DANH SÁCH TÀI KHOẢN VÀ DỮ LIỆU MẪU ĐỂ CHẤM ĐIỂM (RUBRIC)
--------------------------------------------------------------------------------
Trong file `database.sql` đã nạp sẵn 3 tài khoản đáp ứng trọn vẹn 32 tiêu chí:

1. TÀI KHOẢN CHỦ SỞ HỮU GHI CHÚ (TÀI KHOẢN CHÍNH):
   - Email: student1@tdtu.edu.vn
   - Mật khẩu: password123
   - Trạng thái: Đã kích hoạt (is_activated: 1)
   - Dữ liệu có sẵn:
     * 2 Ghi chú được ghim lên đầu (Sắp xếp theo thời gian ghim pinned_at mới nhất)
     * 1 Ghi chú đã khóa mật khẩu riêng (Mật khẩu mở khóa: note123456)
     * 1 Ghi chú chia sẻ cho student2 với quyền CHỈNH SỬA (Edit) để test realtime
     * 1 Ghi chú chia sẻ cho student2 với quyền CHỈ XEM (Read-only)
     * 4 Nhãn: "Học tập", "Công việc", "Web Programming", "Cá nhân"

2. TÀI KHOẢN CỘNG TÁC VIÊN (KIỂM TRA "SHARED WITH ME"):
   - Email: student2@tdtu.edu.vn
   - Mật khẩu: password123
   - Trạng thái: Đã kích hoạt (is_activated: 1)
   - Dữ liệu có sẵn:
     * Nhận được 2 ghi chú từ student1 trong mục "Shared with me" (1 note quyền Edit, 1 note quyền Read-only).

3. TÀI KHOẢN CHƯA KÍCH HOẠT (KIỂM TRA BANNER CẢNH BÁO - TIÊU CHÍ 2):
   - Email: unverified@tdtu.edu.vn
   - Mật khẩu: password123
   - Trạng thái: Chưa kích hoạt (is_activated: 0, hiển thị Banner cảnh báo)
   - Link kích hoạt tài khoản trực tiếp:
     `http://localhost/backend-php/api/auth/activate.php?token=demo-activation-token-tdtu-2026`


IV. DANH SÁCH ENDPOINT API RESTFUL PHÍA FRONT-END GỌI ĐẾN
--------------------------------------------------------------------------------
1. Quản lý tài khoản (Auth & Profile):
   - POST   /api/auth/register.php        : Đăng ký tài khoản (bcrypt, auto-login, gửi mail)
   - GET    /api/auth/activate.php?token= : Kích hoạt tài khoản qua link email
   - POST   /api/auth/login.php           : Đăng nhập cấp JWT Token
   - POST   /api/auth/logout.php          : Đăng xuất
   - POST   /api/auth/forgot-password.php : Gửi mã OTP 6 số và link qua email
   - POST   /api/auth/verify-otp.php      : Xác thực mã OTP
   - POST   /api/auth/reset-password.php  : Đổi mật khẩu mới (bắt buộc login thủ công)
   - GET    /api/users/profile.php        : Xem hồ sơ cá nhân và ảnh đại diện
   - POST   /api/users/profile.php        : Đổi tên hiển thị & upload ảnh avatar (file < 5MB)
   - POST   /api/users/change-password.php: Đổi mật khẩu tài khoản
   - GET    /api/users/preferences.php    : Lấy cấu hình giao diện
   - POST   /api/users/preferences.php    : Lưu tùy biến cỡ chữ, màu sắc, Dark/Light theme

2. Quản lý ghi chú (Notes CRUD, Search & Filters):
   - GET    /api/notes/index.php          : Lấy danh sách ghi chú (hỗ trợ ?search=... và ?labelId=...)
   - POST   /api/notes/index.php          : Tạo ghi chú mới (Chỉ có title & content là bắt buộc)
   - GET    /api/notes/detail.php?id=...  : Xem chi tiết ghi chú
   - PUT    /api/notes/detail.php?id=...  : Sửa ghi chú (Hỗ trợ Auto-save ngầm debounce 300-500ms)
   - DELETE /api/notes/detail.php?id=...  : Xóa ghi chú (Kiểm tra pass nếu note bị khóa)
   - POST   /api/notes/pin.php?id=...     : Ghim / Bỏ ghim ghi chú lên đầu danh sách

3. Bảo vệ mật khẩu ghi chú (Tiêu chí 23 & 24):
   - POST   /api/notes/lock.php?id=...    : Đặt mật khẩu khóa ghi chú (nhập 2 lần, băm bcrypt)
   - POST   /api/notes/unlock.php?id=...  : Mở khóa để xem/sửa nội dung ghi chú
   - POST   /api/notes/disable-lock.php?id=... : Hủy mật khẩu bảo vệ (nhập đúng pass hiện tại)
   - POST   /api/notes/change-password.php?id=... : Đổi pass note (nhập pass cũ + pass mới 2 lần)

4. Quản lý nhãn (Labels CRUD & Quan hệ n-n):
   - GET    /api/labels/index.php         : Lấy danh sách nhãn của người dùng
   - POST   /api/labels/index.php         : Tạo nhãn mới
   - PUT    /api/labels/detail.php?id=... : Đổi tên nhãn (Các note liên quan tự động cập nhật)
   - DELETE /api/labels/detail.php?id=... : Xóa nhãn (Toàn bộ ghi chú được bảo toàn nguyên vẹn)
   - POST   /api/labels/attach.php?noteId=... : Gắn/gỡ nhãn nhanh cho ghi chú

5. Tệp tin đính kèm (Ảnh, Video, File PDF/Word/ZIP):
   - POST   /api/attachments/upload.php?noteId=... : Upload nhiều tệp đính kèm vào ghi chú
   - GET    /api/attachments/download.php?id=...  : Tải tệp đính kèm về máy
   - DELETE /api/attachments/delete.php?id=...    : Xóa tệp đính kèm

6. Chia sẻ ghi chú (Share & Collaboration):
   - POST   /api/shares/share.php?noteId=...      : Chia sẻ qua email (validate user, gửi email)
   - GET    /api/shares/shared-with-me.php        : Mục riêng hiển thị các ghi chú được chia sẻ
   - GET    /api/shares/note-shares.php?noteId=...: Xem danh sách những người đã được chia sẻ
   - PUT    /api/shares/manage-share.php?shareId=... : Đổi quyền hạn (Read <=> Edit)
   - DELETE /api/shares/manage-share.php?shareId=... : Thu hồi quyền chia sẻ ghi chú


V. TỔNG HỢP CÂU TRẢ LỜI VẤN ĐÁP CÁ NHÂN (ORAL EXAM CHO THÀNH VIÊN BE)
--------------------------------------------------------------------------------
Câu 1: Tại sao mỗi note lại có password riêng và lưu trữ như thế nào trong PHP?
Trả lời: 
Mỗi ghi chú có thể chứa thông tin nhạy cảm riêng biệt nên cần mật khẩu độc lập, không dùng chung mật khẩu tài khoản. Trong CSDL MySQL, cột `password_hash` trong bảng `notes` lưu mật khẩu đã được băm bằng thuật toán Bcrypt thông qua hàm chuẩn của PHP: `password_hash($password, PASSWORD_BCRYPT)`. Khi người dùng mở note bị khóa, client gửi mật khẩu lên endpoint `/api/notes/unlock.php`, PHP sử dụng `password_verify($password, $note['password_hash'])`. Nếu khớp, server mới trả về nội dung giải mã.

Câu 2: Cơ chế OTP khôi phục mật khẩu hoạt động ra sao và bảo mật thế nào?
Trả lời: 
Khi người dùng yêu cầu quên mật khẩu, server PHP sinh ngẫu nhiên mã số gồm 6 chữ số qua hàm `rand(100000, 999999)` và thiết lập thời hạn hết hạn sau đúng 15 phút, lưu vào 2 cột `reset_password_otp` và `reset_password_otp_expires_at` trong bảng `users`. Khi người dùng nhập OTP để đặt lại mật khẩu mới, server kiểm tra khớp mã và kiểm tra thời gian hiện tại không vượt quá thời hạn. Sau khi cập nhật mật khẩu mới thành công, server gán mã OTP về `NULL` để ngăn chặn hoàn toàn việc tái sử dụng mã (Chống Replay attack).

Câu 3: Khi xóa một nhãn (Label), tại sao các ghi chú không bị xóa?
Trả lời: 
Do thiết kế CSDL tuân thủ chuẩn quan hệ nhiều - nhiều ($n-n$) thông qua bảng trung gian `note_labels` (chứa `note_id` và `label_id`). Khi người dùng xóa một nhãn, server chỉ thực hiện câu lệnh `DELETE FROM note_labels WHERE label_id = ?` và `DELETE FROM labels WHERE id = ?`. Bảng `notes` hoàn toàn độc lập nên toàn bộ ghi chú vẫn giữ nguyên vẹn 100%.
================================================================================
