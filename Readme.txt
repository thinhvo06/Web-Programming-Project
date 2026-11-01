================================================================================
ĐẠI HỌC TÔN ĐỨC THẮNG - KHOA CÔNG NGHỆ THÔNG TIN
BÁO CÁO HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG (README.TXT)
Môn học: 503073 – Lập trình & Ứng dụng Web | Học kỳ I / 2026-2027
Đề tài: Ứng dụng Quản lý Ghi chú Trực tuyến (TDTU Note App)
Repository GitHub: https://github.com/thinhvo06/Web-Programming-Project.git
================================================================================

I. THÔNG TIN NHÓM & PHÂN CÔNG NHIỆM VỤ (TEAMWORK & DIVISION OF WORK)
--------------------------------------------------------------------------------
1. THÀNH VIÊN 1: FRONT-END, UI/UX & PWA OFFLINE
   - Họ và tên: [Điền Họ và tên Thành viên 1]
   - Mã số sinh viên: [Điền MSSV Thành viên 1]
   - Vai trò chính:
     * Xây dựng giao diện ứng dụng (SPA / PWA) bằng React 18, Vite, Tailwind CSS.
     * Thiết kế Layout chuyển đổi linh hoạt: Dạng dòng (List View) và Dạng lưới (Grid View).
     * Cơ chế Tự động lưu ngầm (Auto-save) không dùng nút Save (Debounce 300-500ms).
     * Modal Tạo và Sửa ghi chú dùng chung 1 giao diện theo quy định chữ đỏ của đề bài.
     * Tìm kiếm trực tiếp tức thì (Live Search) không dùng nút Tìm kiếm.
     * Tính năng hoạt động Ngoại tuyến (PWA Offline) với Service Worker & IndexedDB.
     * Thiết kế giao diện tương thích đa thiết bị (Responsive: Mobile, Tablet, PC).
     * Giao diện cộng tác thời gian thực (Real-time Collaboration Editor).

2. THÀNH VIÊN 2: BACK-END, CSDL, REALTIME WEBSOCKET & DEVOPS
   - Họ và tên: [Điền Họ và tên Thành viên 2]
   - Mã số sinh viên: [Điền MSSV Thành viên 2]
   - Vai trò chính:
     * Xây dựng kiến trúc RESTful API bằng PHP thuần (Vanilla/Core PHP 8.x).
     * Thiết kế CSDL quan hệ MySQL/MariaDB chuẩn hóa 3NF, bảo mật PDO Prepared Statements (100% chống SQL Injection).
     * Xác thực người dùng bằng JWT Token (HMAC-SHA256) và băm mật khẩu Bcrypt (password_hash / password_verify).
     * Cơ chế khóa bảo vệ riêng biệt cho từng ghi chú (Note Password) bằng Bcrypt độc lập.
     * Dịch vụ Email & OTP 6 số khôi phục mật khẩu (thời hạn 15 phút, chống Replay attack).
     * Xây dựng máy chủ WebSocket (Node.js/Socket.io) phục vụ cộng tác thời gian thực trên ghi chú.
     * Quản lý tệp tin đính kèm đa phương tiện (Ảnh, Video, Tệp tài liệu Word/PDF/ZIP).
     * Viết kịch bản tự động hóa và tài liệu hướng dẫn triển khai hệ thống (Readme.txt, start_project_php.bat).


II. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ HỆ THỐNG
--------------------------------------------------------------------------------
1. Phía Máy khách (Front-End Client):
   - Công nghệ: React 18, Vite 6, Tailwind CSS, Lucide Icons.
   - Quản lý trạng thái (State Management): React Context API (AuthContext, NoteContext).
   - Cơ sở dữ liệu phía Client: IndexedDB (Dexie / idb) lưu trữ dữ liệu ngoại tuyến.
   - PWA Service Worker: Cache tài nguyên tĩnh (HTML/CSS/JS) cho phép mở ứng dụng ngay cả khi không có kết nối Internet.
   - Real-time Client: Socket.io Client kết nối phòng soạn thảo cộng tác.

2. Phía Máy chủ (Back-End Server):
   - Ngôn ngữ: PHP 8.x thuần (Core PHP, không dùng Laravel/Symfony theo giáo trình thực hành).
   - Truy vấn CSDL: PHP Data Objects (PDO) kết hợp tham số hóa câu lệnh (Prepared Statements).
   - Mã hóa & Bảo mật: Bcrypt hashing cho mật khẩu tài khoản và mật khẩu bảo vệ từng ghi chú.
   - Cơ chế xác thực: JSON Web Token (JWT) tự xây dựng chuẩn RFC 7519, mã hóa chữ ký HMAC-SHA256.
   - Xử lý upload: Hỗ trợ cả Multipart Form-Data và JSON Base64 Data URL, kiểm tra MIME type an toàn.
   - Real-time Server: Node.js + Socket.io Server (cổng 5001) xử lý Room Broadcast cho ghi chú chia sẻ.
   - Nhật ký Email & OTP: Tự động ghi nhận thông tin gửi mail tại: `backend-php/logs/mail_logs.txt`.


III. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY ỨNG DỤNG (CHI TIẾT TỪNG BƯỚC)
--------------------------------------------------------------------------------
Ứng dụng có thể được khởi chạy theo 2 cách tùy thuộc vào môi trường máy tính của Giảng viên:

================================================================================
CÁCH 1: KHỞI CHẠY NHANH BẰNG DÒNG LỆNH HOẶC BATCH FILE (KHUYÊN DÙNG TRÊN WINDOWS)
================================================================================

BƯỚC 1: KHỞI ĐỘNG VÀ IMPORT CƠ SỞ DỮ LIỆU MYSQL / MARIADB
1. Khởi động dịch vụ MySQL / MariaDB (mặc định cổng 3306, user: root, password: rỗng).
2. Tạo CSDL tên `tdtu_note_app` và import file `backend-php/database.sql`:
   - Dùng dòng lệnh CMD / PowerShell:
     mysql -u root -e "CREATE DATABASE IF NOT EXISTS tdtu_note_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
     mysql -u root tdtu_note_app < "backend-php/database.sql"
   - Hoặc mở phpMyAdmin (http://localhost/phpmyadmin), tạo CSDL `tdtu_note_app` và Import file `backend-php/database.sql`.

BƯỚC 2: KHỞI CHẠY HỆ THỐNG
* Tùy chọn 2.1: Nhấn đúp chuột vào file `start_project_php.bat` tại thư mục gốc của project.
  (Kịch bản sẽ tự động kiểm tra cổng 3306, chạy PHP Backend port 8000, chạy WebSocket port 5001, và chạy Frontend Vite port 5173).

* Tùy chọn 2.2: Khởi chạy thủ công qua 3 cửa sổ Terminal độc lập:
  - Terminal 1 (Back-End PHP):
      cd backend-php
      php -S 0.0.0.0:8000 router.php
      -> Máy chủ Backend API sẵn sàng tại: http://localhost:8000/api

  - Terminal 2 (WebSocket Realtime Server):
      cd backend-php/realtime-socket
      npm install
      npm start
      -> Máy chủ WebSocket sẵn sàng tại: http://localhost:5001

  - Terminal 3 (Front-End React Vite):
      cd frontend
      npm install
      npm run dev
      -> Ứng dụng web hiển thị tại: http://localhost:5173

BƯỚC 3: MỞ TRÌNH DUYỆT WEB
- Truy cập vào địa chỉ: 👉 http://localhost:5173
- Hệ thống sẽ tự động chuyển hướng đến màn hình Đăng nhập (Login).

================================================================================
CÁCH 2: TRIỂN KHAI TRÊN MÁY CHỦ XAMPP (APACHE + MYSQL)
================================================================================
1. Copy thư mục `backend-php` vào thư mục `htdocs` của XAMPP:
   `C:\xampp\htdocs\backend-php`
2. Mở XAMPP Control Panel, Start **Apache** (cổng 80) và **MySQL** (cổng 3306).
3. Mở trình duyệt vào `http://localhost/phpmyadmin`, tạo CSDL `tdtu_note_app` và Import `backend-php/database.sql`.
4. Trong thư mục `frontend/.env`, cấu hình:
   VITE_USE_MOCK=false
   VITE_API_URL=http://localhost/backend-php/api
   VITE_SOCKET_URL=http://localhost:5001
5. Mở Terminal tại `backend-php/realtime-socket` và chạy `npm start`.
6. Mở Terminal tại `frontend` và chạy `npm run dev` để truy cập giao diện tại `http://localhost:5173`.


IV. DANH SÁCH TÀI KHOẢN VÀ DỮ LIỆU CÓ SẴN ĐỂ CHẤM ĐIỂM (PRE-LOADED ACCOUNTS)
--------------------------------------------------------------------------------
Trong file `database.sql` đã nạp sẵn 3 tài khoản với đầy đủ dữ liệu phong phú để phục vụ kiểm tra toàn diện 32 tiêu chí của Rubric:

1. TÀI KHOẢN CHỦ SỞ HỮU GHI CHÚ (TÀI KHOẢN CHÍNH - OWNER):
   - Email: student1@tdtu.edu.vn
   - Mật khẩu đăng nhập: password123
   - Trạng thái: Đã kích hoạt (is_activated: 1).
   - Dữ liệu có sẵn trong tài khoản:
     * 2 Ghi chú được GHIM lên đầu danh sách (📌), sắp xếp theo thời gian ghim `pinned_at` mới nhất.
     * 1 Ghi chú đã KHÓA MẬT KHẨU BẢO VỆ (🔒) với mật khẩu riêng biệt là: `note123456`.
       (Yêu cầu nhập mật khẩu khi xem, sửa hoặc xóa).
     * 1 Ghi chú CHIA SẺ cho `student2@tdtu.edu.vn` với quyền CHỈNH SỬA (Edit) để kiểm tra Realtime Collaboration.
     * 1 Ghi chú CHIA SẺ cho `student2@tdtu.edu.vn` với quyền CHỈ XEM (Read-only).
     * 4 Nhãn phân loại: "Học tập", "Công việc", "Web Programming", "Cá nhân".
     * Các tệp tin đính kèm (Ảnh minh họa, video và file tài liệu đính kèm).

2. TÀI KHOẢN CỘNG TÁC VIÊN (KIỂM TRA CHỨC NĂNG "SHARED WITH ME"):
   - Email: student2@tdtu.edu.vn
   - Mật khẩu đăng nhập: password123
   - Trạng thái: Đã kích hoạt (is_activated: 1).
   - Dữ liệu có sẵn:
     * Mục "Shared with me" hiển thị 2 ghi chú nhận được từ `student1@tdtu.edu.vn`.
     * Ghi chú 1 (Quyền Edit): Cho phép cộng tác chỉnh sửa đồng thời, đồng bộ qua WebSocket.
     * Ghi chú 2 (Quyền Read-only): Chỉ cho phép xem nội dung, khóa chức năng chỉnh sửa.

3. TÀI KHOẢN CHƯA KÍCH HOẠT (KIỂM TRA TIÊU CHÍ 2 - BANNER CẢNH BÁO):
   - Email: unverified@tdtu.edu.vn
   - Mật khẩu đăng nhập: password123
   - Trạng thái: Chưa kích hoạt (is_activated: 0).
   - Kiểm tra: Khi đăng nhập, trên đầu màn hình sẽ xuất hiện một Banner cảnh báo nổi bật thông báo tài khoản chưa được kích hoạt và yêu cầu kiểm tra email.
   - Thao tác kích hoạt nhanh: Click vào liên kết kích hoạt mẫu:
     http://localhost:8000/api/auth/activate.php?token=demo-activation-token-tdtu-2026
     -> Banner cảnh báo sẽ tự động biến mất và tài khoản chuyển sang trạng thái đã kích hoạt.

4. HƯỚNG DẪN KIỂM TRA MÃ OTP VÀ EMAIL HỆ THỐNG:
   - Toàn bộ email gửi đi (Link kích hoạt tài khoản khi đăng ký, Mã OTP 6 chữ số khi quên mật khẩu) được ghi nhận tự động vào tệp nhật ký:
     `backend-php/logs/mail_logs.txt`
   - Khi kiểm tra tính năng "Quên mật khẩu" (Forgot Password), nhập email `student1@tdtu.edu.vn`, sau đó mở tệp `backend-php/logs/mail_logs.txt` để lấy mã OTP 6 số vừa được cấp (hiệu lực trong vòng 15 phút) và tiến hành đặt lại mật khẩu mới.


V. BẢNG ĐỐI CHIẾU 32 TIÊU CHÍ RUBRIC VỚI FRONT-END & BACK-END
--------------------------------------------------------------------------------
STT | Tiêu chí Rubric                 | Điểm | Thành phần Front-End (React/UI)         | Thành phần Back-End (PHP API / DB)
----+---------------------------------+------+-----------------------------------------+-----------------------------------------
1   | User registration               | 0.25 | AuthPage.jsx (Register form, validate)  | POST /api/auth/register.php (bcrypt)
2   | Account activation              | 0.25 | ActivationBanner.jsx (Banner cảnh báo)  | GET /api/auth/activate.php?token=...
3   | User login and logout           | 0.25 | AuthPage.jsx, AuthContext (JWT storage) | POST /api/auth/login.php, logout.php
4   | Password reset                  | 0.25 | ForgotPasswordModal.jsx (OTP & New pass)| POST /api/auth/forgot-password, verify, reset
5   | View profile and avatar         | 0.25 | ProfileModal.jsx, Navbar avatar icon    | GET /api/users/profile.php
6   | Edit profile and avatar         | 0.25 | ProfileModal.jsx (Preview file, submit) | POST /api/users/profile.php (Upload file)
7   | Change password                 | 0.25 | ChangePasswordModal.jsx (old & new x2)  | POST /api/users/change-password.php
8   | User preferences                | 0.25 | PreferencesModal.jsx (Font, Color, Dark)| GET & POST /api/users/preferences.php
9   | Display notes in listview       | 0.25 | NoteList.jsx (Dạng danh sách hàng ngang)| GET /api/notes/index.php
10  | Display notes in gridview       | 0.25 | NoteGrid.jsx, NoteCard.jsx (Dạng thẻ)   | GET /api/notes/index.php
11  | Create notes (Chung modal sửa)  | 0.25 | NoteEditorModal.jsx (Title & Content)   | POST /api/notes/index.php
12  | Update notes                    | 0.25 | NoteEditorModal.jsx (Chung 1 giao diện) | PUT /api/notes/detail.php?id=...
13  | Delete notes (Có popup hỏi)     | 0.25 | ConfirmDialog.jsx (Bắt buộc xác nhận)   | DELETE /api/notes/detail.php?id=...
14  | Auto-save notes (Không nút Lưu) | 0.25 | NoteEditorModal.jsx (Debounce 300-500ms)| PUT /api/notes/detail.php (Auto update)
15  | Attach images/video to notes    | 0.25 | AttachmentManager.jsx (Preview media)   | POST /api/attachments/upload.php
16  | Attach files to notes           | 0.25 | AttachmentList.jsx (Download PDF/DOC/ZIP)| GET /api/attachments/download.php
17  | Pin notes to top                | 0.25 | NoteCard.jsx (Ghim 📌, pinned_at mới)   | POST /api/notes/pin.php?id=...
18  | Special-note status indicators  | 0.25 | NoteBadges.jsx (Icon Ghim, Khóa, Share) | GET /api/notes/index.php
19  | Search notes (Live search)      | 0.25 | SearchBar.jsx (Live 300ms, không nút)   | GET /api/notes/index.php?search=...
20  | Label management (CRUD)         | 0.25 | LabelManagerModal.jsx (Thêm/Sửa/Xóa)    | /api/labels/index.php & detail.php
21  | Attach labels to notes          | 0.25 | NoteEditorModal.jsx (Gắn/Gỡ nhãn)       | POST /api/labels/attach.php?noteId=...
22  | Filter notes based on labels    | 0.25 | Sidebar.jsx (Click nhãn lọc danh sách)  | GET /api/notes/index.php?labelId=...
23  | Enable / disable password       | 0.50 | NoteLockModal.jsx (Pass x2 / Nhập pass) | POST /api/notes/lock.php, disable-lock.php
24  | Password protection & change    | 0.50 | NoteUnlockModal.jsx, NoteChangePassModal| POST /api/notes/unlock.php, change-pass
25  | Share and receive notes         | 0.50 | ShareModal.jsx, SharedWithMePage.jsx    | /api/shares/share.php, shared-with-me.php
26  | Collaboration & realtime edit   | 0.50 | useSocketEditor.js, NoteEditorModal.jsx | Socket.io Server (backend-php/realtime-socket)
27  | AI Summary                      | 0.25 | AISummaryModal.jsx (Nút tóm tắt note)   | POST /api/ai/summarize.php
28  | AI Question & Answer            | 0.25 | AIChatDrawer.jsx (Hỏi đáp, link trích)  | POST /api/ai/chat.php
29  | UI and UX (Design & Feedback)   | 0.50 | Tailwind CSS, Toast, Skeleton, Empty    | Chuẩn hóa định dạng JSON phản hồi API
30  | Responsive Design               | 0.50 | Tailwind Mobile First (Sm/Md/Lg/Xl)     | Tối ưu payload JSON gọn nhẹ
31  | Offline Capabilities (PWA)      | 0.50 | Service Worker, IndexedDB (Offline sync)| Fallback dữ liệu khi ngắt kết nối
32  | Online deployment / Docker      | 0.50 | Dockerfile, docker-compose.yml          | docker-compose.yml (PHP + MariaDB + Vite)


VI. TUÂN THỦ NGHIÊM NGẶT CÁC NGUYÊN TẮC CHỮ ĐỎ (RED-TEXT RULES)
--------------------------------------------------------------------------------
1. TUYỆT ĐỐI KHÔNG TỰ THÊM TÍNH NĂNG NGOÀI ĐỀ BÀI:
   - Hệ thống không thêm các mục thừa như: Thùng rác (Trash), Lưu trữ (Archive), Xuất PDF ngoài luồng... đảm bảo tuân thủ 100% tài liệu mô tả của môn học.

2. FORM TẠO VÀ SỬA GHI CHÚ CHUNG MỘT MÀN HÌNH DUY NHẤT:
   - Được hiện thực tại `frontend/src/components/notes/NoteEditorModal.jsx`. Khi tạo note mới hoặc nhấn vào một ghi chú có sẵn để chỉnh sửa, cùng một giao diện modal được mở ra; dữ liệu tiêu đề và nội dung được liên kết đồng nhất.
   - Chỉ có Tiêu đề (Title) và Nội dung (Content) là bắt buộc nhập.

3. CƠ CHẾ TỰ ĐỘNG LƯU (AUTO-SAVE) - TUYỆT ĐỐI KHÔNG CÓ NÚT "LƯU":
   - Khi người dùng chỉnh sửa tiêu đề hoặc nội dung, hệ thống sử dụng hook debounce (300-500ms) để tự động gọi API ngầm lên máy chủ. Giao diện có hiển thị trạng thái "Đang lưu..." và "Đã lưu tất cả thay đổi" nhưng hoàn toàn không có nút "Save" hay "Lưu" thủ công.

4. XÓA GHI CHÚ BẮT BUỘC CÓ HỘP THOẠI XÁC NHẬN (CONFIRMATION DIALOG):
   - Khi người dùng nhấn nút Xóa ghi chú, một hộp thoại Modal xác nhận (`ConfirmDialog.jsx`) sẽ lập tức hiển thị để yêu cầu xác nhận rõ ràng, ngăn ngừa việc vô tình mất mát dữ liệu.

5. TÌM KIẾM TRỰC TIẾP (LIVE SEARCH):
   - Ô tìm kiếm trên thanh điều hướng không có nút "Tìm kiếm". Kết quả được lọc tự động ngay khi người dùng gõ phím (độ trễ 300ms) và tìm kiếm đồng thời trên cả Tiêu đề và Nội dung ghi chú.


VII. BỘ CÂU HỎI VÀ TRẢ LỜI ÔN TẬP VẤN ĐÁP CÁ NHÂN (ORAL EXAM PREPARATION)
--------------------------------------------------------------------------------
Theo quy định của đề bài, mỗi thành viên phải tham gia vấn đáp cá nhân trực tiếp với Giảng viên để chứng minh mức độ đóng góp thực tế và hiểu biết sâu sắc về mã nguồn. Dưới đây là các câu hỏi trọng tâm đã được chuẩn bị sẵn:

================================================================================
A. CÂU HỎI DÀNH CHO THÀNH VIÊN 1 (FRONT-END, UI/UX, PWA)
================================================================================
Câu FE 1: Cơ chế Auto-save được triển khai như thế nào mà không gây quá tải mạng (Network Bottleneck)?
Trả lời:
- Em áp dụng kỹ thuật Debounce với thời gian chờ từ 300ms - 500ms bên trong `useEffect` của React. Mỗi khi người dùng gõ một ký tự vào Tiêu đề hoặc Nội dung, hàm cleanup của `useEffect` sẽ xóa bộ đếm thời gian cũ (`clearTimeout`) và thiết lập bộ đếm mới.
- Chỉ khi người dùng dừng gõ phím đủ 400ms, callback mới được kích hoạt để gửi request cập nhật ngầm về API. Ngoài ra, khi modal bị đóng đột ngột (unmount), em kích hoạt lưu ngay lập tức trạng thái hiện tại để đảm bảo không bị mất ký tự cuối cùng.

Câu FE 2: Tính năng PWA Offline hoạt động như thế nào khi người dùng bị ngắt mạng Internet?
Trả lời:
- Về tài nguyên giao diện (HTML, CSS, JavaScript, Icons), Service Worker sẽ chặn sự kiện `fetch` và phục vụ ngay từ Cache Storage theo chiến lược Stale-While-Revalidate hoặc Cache-First.
- Về dữ liệu ghi chú, em sử dụng cơ sở dữ liệu trình duyệt IndexedDB. Khi người dùng tải trang lúc có mạng, dữ liệu ghi chú từ API được lưu bản sao vào IndexedDB. Khi mất mạng (sự kiện `navigator.onLine === false`), giao diện chuyển sang đọc và hiển thị dữ liệu từ IndexedDB, đồng thời hiển thị một banner thông báo trạng thái Offline. Khi có kết nối mạng trở lại, các thao tác chỉnh sửa tạm thời sẽ được tự động đồng bộ (sync) lên máy chủ PHP.

Câu FE 3: Làm thế nào để đảm bảo tính an toàn cho Ghi chú bị Khóa mật khẩu ở phía Front-End?
Trả lời:
- Khi danh sách ghi chú được tải về từ API, đối với những ghi chú có `is_locked: 1`, Back-End hoàn toàn không trả về trường `content` trong payload JSON (hoặc chỉ trả về chuỗi rỗng/mã hóa).
- Ở Front-End, thẻ ghi chú sẽ hiển thị icon Ổ khóa (🔒) và nội dung bị che mờ. Người dùng không thể xem được nội dung kể cả khi mở DevTools kiểm tra phần tử HTML hay Inspect Network. Chỉ khi người dùng nhập đúng mật khẩu qua hộp thoại `NoteUnlockModal`, máy chủ mới xác thực và trả về nội dung của ghi chú đó.

Câu FE 4: Khi hai người dùng cùng mở một ghi chú chia sẻ, Front-End đồng bộ giao diện thời gian thực qua WebSocket như thế nào?
Trả lời:
- Em sử dụng thư viện `socket.io-client`. Khi mở modal chỉnh sửa ghi chú, component gửi sự kiện `join-note` kèm theo `noteId` để tham gia vào Room riêng của ghi chú đó trên máy chủ WebSocket.
- Khi người dùng gõ nội dung, ngoài việc kích hoạt Auto-save về API PHP, client sẽ phát (emit) sự kiện `note-content-change` kèm nội dung mới và vị trí con trỏ. Các client khác đang ở trong cùng Room sẽ lắng nghe sự kiện này và cập nhật state của Editor mà không làm nhảy vị trí con trỏ của người đang đọc.

================================================================================
B. CÂU HỎI DÀNH CHO THÀNH VIÊN 2 (BACK-END, CSDL, REALTIME & DEVOPS)
================================================================================
Câu BE 1: Tại sao mỗi ghi chú lại có mật khẩu bảo vệ riêng và Back-End PHP lưu trữ mật khẩu này như thế nào?
Trả lời:
- Mỗi ghi chú có thể chứa thông tin nhạy cảm riêng biệt nên cần một lớp mật khẩu độc lập, không dùng chung với mật khẩu tài khoản đăng nhập của người dùng.
- Trong CSDL MySQL, cột `password_hash` trong bảng `notes` lưu trữ chuỗi băm của mật khẩu này bằng thuật toán Bcrypt thông qua hàm chuẩn của PHP: `password_hash($password, PASSWORD_BCRYPT)`. Khi người dùng gửi mật khẩu lên để mở khóa tại endpoint `/api/notes/unlock.php`, PHP sử dụng `password_verify($password, $note['password_hash'])` để kiểm tra tính hợp lệ. Nếu chính xác, server mới giải mã và trả về trường `content`.

Câu BE 2: Quy trình cấp phát và xác thực mã OTP quên mật khẩu được thiết kế bảo mật ra sao để chống tấn công Replay Attack và Brute Force?
Trả lời:
- Khi người dùng yêu cầu đặt lại mật khẩu, máy chủ PHP sinh ngẫu nhiên một mã OTP gồm 6 chữ số (`rand(100000, 999999)`) và lưu vào bảng `users` cùng với mốc thời gian hết hạn sau đúng 15 phút (`DATE_ADD(NOW(), INTERVAL 15 MINUTE)`).
- Đồng thời, hệ thống tạo một token bí mật đi kèm và ghi nhận thông tin gửi email. Khi người dùng xác thực OTP và đổi mật khẩu thành công, máy chủ sẽ đặt lại hai cột `reset_password_otp` và `reset_password_otp_expires_at` về giá trị `NULL`. Việc xóa ngay mã OTP sau khi sử dụng thành công ngăn chặn hoàn toàn việc tin tặc tái sử dụng mã (Replay Attack).

Câu BE 3: Hãy giải thích thiết kế quan hệ giữa Bảng Ghi chú (Notes) và Bảng Nhãn (Labels) trong CSDL? Khi xóa một nhãn, tại sao các ghi chú không bị xóa mất?
Trả lời:
- Mối quan hệ giữa Ghi chú và Nhãn là quan hệ nhiều - nhiều ($n-n$), vì một ghi chú có thể gắn nhiều nhãn, và một nhãn có thể áp dụng cho nhiều ghi chú khác nhau.
- Em thiết kế bảng trung gian `note_labels` gồm 2 khóa ngoại: `note_id` (tham chiếu đến `notes.id`) và `label_id` (tham chiếu đến `labels.id`).
- Khi người dùng thực hiện xóa một nhãn, câu lệnh SQL phía Back-End là `DELETE FROM note_labels WHERE label_id = ?` và `DELETE FROM labels WHERE id = ?`. Vì bảng `notes` hoàn toàn độc lập, nên toàn bộ ghi chú của người dùng vẫn được bảo toàn nguyên vẹn 100%, chỉ có liên kết nhãn của ghi chú đó bị gỡ bỏ.

Câu BE 4: Kiến trúc máy chủ WebSocket (Socket.io) được tích hợp song song với PHP Backend thuần như thế nào?
Trả lời:
- Do PHP truyền thống hoạt động theo mô hình Stateless Request-Response ngắn hạn, em triển khai một dịch vụ phụ trợ (Microservice) bằng Node.js và Socket.io tại thư mục `backend-php/realtime-socket` chạy trên cổng 5001.
- Dịch vụ này quản lý các kết nối WebSocket liên tục (Persistent Connections). Mỗi ghi chú tương ứng với một Socket Room (`note_${noteId}`). Khi có người dùng cập nhật nội dung, socket server sẽ phát sóng (`socket.to(room).emit`) ngay lập tức tới các cộng tác viên trong phòng. Đồng thời, dữ liệu cuối cùng được gửi lưu trữ bền vững vào CSDL MySQL thông qua RESTful API của PHP.


VIII. LƯU Ý QUAN TRỌNG KHI NỘP BÀI (SUBMISSION CHECKLIST)
--------------------------------------------------------------------------------
1. GIỮ NGUYÊN THƯ MỤC ẨN `.git`:
   - Trước khi nén gói nộp bài, nhóm đã kiểm tra và đảm bảo thư mục `.git` được giữ nguyên vẹn trong thư mục nộp để Giảng viên có thể kiểm tra lịch sử commit và thời gian đóng góp.
2. DỌN DẸP MÃ NGUỒN (CLEAN CODE):
   - Xóa bỏ thư mục `node_modules` và các file tạm không cần thiết trong thư mục nén để giảm dung lượng file nộp theo đúng yêu cầu đề bài.
3. HỒ SƠ NỘP BÀI GỒM ĐỦ CÁC FILE:
   - `Rubric.xlsx`: Bảng tự đánh giá 32 tiêu chí kèm link GitHub.
   - `Readme.txt`: File hướng dẫn cài đặt và chạy chi tiết này.
   - `demo.mp4`: Video demo độ phân giải Full HD (1080p) có mặt và giọng nói của cả 2 thành viên.
   - Thư mục mã nguồn `source` chứa đầy đủ Front-End, Back-End PHP, WebSocket Server và Database `database.sql`.
================================================================================
HẾT BÁO CÁO HƯỚNG DẪN - KÍNH CHÚC THẦY CÔ NHIỀU SỨC KHỎE VÀ CHẤM BÀI THUẬN LỢI!
================================================================================
