================================================================================
ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN
BÁO CÁO HƯỚNG DẪN CHẠY ỨNG DỤNG ĐỒ ÁN CUỐI KỲ (README.TXT)
Môn học: 503073 – Lập trình & Ứng dụng Web | Học kỳ I / 2026-2027
Đề tài: Ứng dụng Quản lý Ghi chú (Note App)
Người thực hiện: Thành viên 2 (Back-end, CSDL & DevOps)
================================================================================

I. TỔNG QUAN HỆ THỐNG VÀ CÔNG NGHỆ BACK-END
--------------------------------------------------------------------------------
- Nền tảng: Node.js (v18+ / v20+ / v24+) & Express.js RESTful API
- WebSocket: Socket.io Server (Xử lý phòng họp trực tuyến và đồng bộ realtime khi cộng tác sửa note nhiều người)
- Cơ sở dữ liệu: Hỗ trợ linh hoạt cả 2 chế độ:
  + Chế độ 1 (Mặc định - Local): SQLite (Không cần cài thêm bất kỳ database engine nào, chạy ngay lập tức)
  + Chế độ 2 (Production / Docker): MySQL 8.0 (Tự động khởi chạy qua Docker Compose)
- Mã hóa & Bảo mật: Bcryptjs (Băm mật khẩu người dùng và mật khẩu riêng cho từng ghi chú), JWT (JSON Web Token)
- Xử lý tệp tin: Multer (Kiểm soát chặt chẽ dung lượng và định dạng ảnh đại diện, file tài liệu/video đính kèm)
- Dịch vụ Email: Nodemailer SMTP (Gửi mail kích hoạt tài khoản, mã OTP khôi phục mật khẩu, thông báo chia sẻ ghi chú)


II. DANH SÁCH TÀI KHOẢN VÀ DỮ LIỆU KIỂM THỬ (SEED DEMO DATA)
--------------------------------------------------------------------------------
Hệ thống đã có sẵn lệnh Seed dữ liệu để chấm đủ 32 tiêu chí Rubric:

1. TÀI KHOẢN CHÍNH (CHỦ SỞ HỮU GHI CHÚ):
   - Email: student1@tdtu.edu.vn
   - Mật khẩu: password123
   - Trạng thái: Đã kích hoạt (is_activated: true)
   - Dữ liệu có sẵn:
     * 2 Ghi chú được ghim lên đầu (Sắp xếp theo thứ tự pinned_at: ghi chú ghim sau nằm trên)
     * 1 Ghi chú đã khóa mật khẩu riêng biệt (Mật khẩu mở khóa: note123456)
     * 1 Ghi chú tài liệu tham khảo công nghệ Web hiện đại
     * 1 Ghi chú chia sẻ cho student2 với quyền CHỈNH SỬA (Edit) để test WebSocket Realtime
     * 1 Ghi chú chia sẻ cho student2 với quyền CHỈ XEM (Read-only)
     * Đầy đủ các nhãn: "Học tập", "Công việc", "Web Programming", "Cá nhân"

2. TÀI KHOẢN CỘNG TÁC (TEST KHU VỰC "SHARED WITH ME" & WEBSOCKET COLLABORATION):
   - Email: student2@tdtu.edu.vn
   - Mật khẩu: password123
   - Trạng thái: Đã kích hoạt (is_activated: true)
   - Dữ liệu có sẵn:
     * Nhận được 2 ghi chú trong mục "Shared with me" từ student1
     * Có thể mở ghi chú "Biên bản họp nhóm" để sửa đồng thời với student1 qua Socket.io

3. TÀI KHOẢN CHƯA KÍCH HOẠT (TEST BANNER & KÍCH HOẠT QUA EMAIL - TIÊU CHÍ 2):
   - Email: unverified@tdtu.edu.vn
   - Mật khẩu: password123
   - Trạng thái: Chưa kích hoạt (is_activated: false, xuất hiện banner cảnh báo)
   - Link kích hoạt tài khoản:
     http://localhost:5000/api/auth/activate/demo-activation-token-tdtu-2026


III. HƯỚNG DẪN CÁCH BUILD VÀ CHẠY ỨNG DỤNG
--------------------------------------------------------------------------------

CÁCH 1: CHẠY TRỰC TIẾP TRÊN MÁY TÍNH (KHUYÊN DÙNG CHO CHẤM BÀI NHANH)
Yêu cầu: Máy đã cài Node.js (v18 trở lên).

Bước 1: Mở Terminal / PowerShell tại thư mục `backend`:
   cd backend

Bước 2: Cài đặt các thư viện cần thiết:
   npm install

Bước 3: Khởi tạo dữ liệu mẫu và tài khoản test:
   npm run seed

Bước 4: Khởi động máy chủ Backend API:
   npm start
   (Hoặc: npm run dev nếu muốn tự động reload khi sửa code)

Hệ thống sẽ chạy tại: http://localhost:5000
API Health Check: http://localhost:5000/api/health


CÁCH 2: CHẠY BẰNG DOCKER COMPOSE (CHẠY TOÀN BỘ HỆ THỐNG BẰNG 1 LỆNH)
Yêu cầu: Máy đã cài Docker & Docker Desktop.

Bước 1: Mở Terminal tại thư mục gốc chứa file `docker-compose.yml`.
Bước 2: Chạy lệnh duy nhất:
   docker compose up --build

Hệ thống sẽ tự động build image Node.js, khởi động container MySQL 8.0 và liên kết với Backend.


IV. DANH SÁCH ENDPOINTS RESTFUL API CHÍNH
--------------------------------------------------------------------------------
1. Quản lý tài khoản (Auth & User):
   - POST   /api/auth/register           : Đăng ký tài khoản (bcrypt, auto-login, gửi mail kích hoạt)
   - GET    /api/auth/activate/:token    : Kích hoạt tài khoản qua link email
   - POST   /api/auth/login              : Đăng nhập cấp JWT Token
   - POST   /api/auth/logout             : Đăng xuất
   - POST   /api/auth/forgot-password    : Gửi mã OTP / link reset mật khẩu qua email
   - POST   /api/auth/verify-reset-otp   : Xác thực OTP reset pass
   - POST   /api/auth/reset-password     : Cập nhật mật khẩu mới (bắt buộc login lại)
   - GET    /api/users/profile           : Xem hồ sơ cá nhân và avatar
   - PUT    /api/users/profile           : Đổi display name và upload ảnh avatar
   - PUT    /api/users/change-password   : Đổi mật khẩu tài khoản
   - GET    /api/users/preferences       : Lấy cài đặt font chữ, màu sắc, Dark/Light mode
   - PUT    /api/users/preferences       : Lưu tùy biến cài đặt vào CSDL

2. Quản lý ghi chú (Notes CRUD, Search & Filters):
   - GET    /api/notes                   : Lấy danh sách note (hỗ trợ ?search=... và ?labelId=...)
   - POST   /api/notes                   : Tạo note mới (Chỉ cần title và content)
   - GET    /api/notes/:id               : Xem chi tiết note
   - PUT    /api/notes/:id               : Sửa note (Dùng cho Auto-save debounce)
   - DELETE /api/notes/:id               : Xóa note (Kiểm tra pass nếu note bị khóa)
   - PATCH  /api/notes/:id/pin           : Ghim/Bỏ ghim note lên đầu danh sách

3. Bảo vệ mật khẩu ghi chú (Tiêu chí 23 & 24):
   - POST   /api/notes/:id/lock          : Khóa note với password (nhập 2 lần trên FE, BE băm bcrypt)
   - POST   /api/notes/:id/unlock        : Xác thực mật khẩu để mở xem/sửa note bị khóa
   - POST   /api/notes/:id/disable-lock  : Hủy mật khẩu bảo vệ (nhập lại pass hiện tại để xác nhận)
   - POST   /api/notes/:id/change-lock-password : Đổi pass note (nhập pass cũ + pass mới 2 lần)

4. Quản lý nhãn (Labels CRUD & Many-to-Many):
   - GET    /api/labels                  : Lấy danh sách nhãn của người dùng
   - POST   /api/labels                  : Tạo nhãn mới
   - PUT    /api/labels/:id              : Đổi tên nhãn (Tất cả note liên quan tự động cập nhật)
   - DELETE /api/labels/:id              : Xóa nhãn (Các ghi chú vẫn giữ nguyên vẹn)

5. Tệp đính kèm (Attachments - Ảnh, Video, Tài liệu):
   - POST   /api/attachments/notes/:noteId : Upload nhiều ảnh, video, tài liệu vào ghi chú
   - GET    /api/attachments/:id/download  : Tải file đính kèm về máy
   - DELETE /api/attachments/:id           : Xóa tệp đính kèm

6. Chia sẻ ghi chú (Share & Collaboration):
   - POST   /api/shares/notes/:id/share  : Chia sẻ note qua email (validate user tồn tại, phân quyền Read/Edit, gửi email thông báo)
   - GET    /api/shares/shared-with-me   : Danh sách mục riêng các ghi chú được người khác chia sẻ
   - GET    /api/shares/notes/:id/shares : Chủ sở hữu xem danh sách những người đã được chia sẻ
   - PUT    /api/shares/shares/:shareId  : Đổi quyền hạn (Read <=> Edit)
   - DELETE /api/shares/shares/:shareId  : Thu hồi quyền chia sẻ ghi chú

7. WebSocket Collaboration (Socket.io):
   - Endpoint: ws://localhost:5000 (Xác thực bằng token JWT ở handshake)
   - Room: note:<noteId>
   - Events phát: note-change, user-typing, leave-note
   - Events nhận: note-updated, user-typing, room-users


V. TỔNG HỢP CÂU TRẢ LỜI VẤN ĐÁP CÁ NHÂN (ORAL EXAM CHO THÀNH VIÊN BE)
--------------------------------------------------------------------------------
Câu 1: Tại sao mỗi note lại có password riêng và lưu trữ như thế nào?
Trả lời: 
Mỗi ghi chú có thể chứa thông tin nhạy cảm riêng biệt nên cần mật khẩu độc lập, không dùng chung với mật khẩu tài khoản. Trong cơ sở dữ liệu, cột `password_hash` trong bảng `notes` lưu mật khẩu đã được băm an toàn bằng thuật toán Bcrypt kèm salt ngẫu nhiên. Khi người dùng muốn xem, sửa hoặc xóa ghi chú đã khóa, client phải gửi mật khẩu lên endpoint `/api/notes/:id/unlock`; server thực hiện so khớp `bcrypt.compare`. Nếu khớp, server mới trả về nội dung giải mã hoặc cho phép thao tác.

Câu 2: Khi xóa một nhãn (Label), tại sao các ghi chú không bị xóa?
Trả lời: 
Do kiến trúc cơ sở dữ liệu tuân thủ chuẩn quan hệ nhiều - nhiều (n-n) thông qua bảng trung gian `note_labels` (chứa 2 khóa ngoại: `note_id` và `label_id`). Khi người dùng xóa một nhãn trong bảng `labels`, server chỉ xóa các bản ghi liên kết tương ứng trong bảng `note_labels`, còn dữ liệu các ghi chú trong bảng `notes` hoàn toàn được bảo toàn nguyên vẹn.
================================================================================
