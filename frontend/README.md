# ỨNG DỤNG QUẢN LÝ GHI CHÚ (NOTE APP) - FRONTEND

> **Môn học:** 503073 – Lập trình & Ứng dụng Web | Đại học Tôn Đức Thắng (TDTU)  
> **Thành viên 1:** Phụ trách Front-end, UI/UX & PWA Offline  
> **Công nghệ sử dụng:** React 18, Vite, Tailwind CSS, Lucide Icons, IndexedDB (PWA Offline), Socket.io Client.

---

## 🎯 Tuân thủ nghiêm ngặt 4 Nguyên tắc chữ đỏ (Red text) của Đề bài:
1. **Chỉ làm đúng các tính năng trong đề:** Tuyệt đối KHÔNG thêm tính năng lạ (thùng rác, lưu trữ, xuất file...).
2. **Form Tạo & Sửa note bắt buộc chung 1 màn hình:** Cả hai thao tác tạo mới và chỉnh sửa đều dùng chung một giao diện Modal NoteEditor duy nhất, tự động tải dữ liệu cũ lên form.
3. **Phải tự động lưu (Auto-save) và TUYỆT ĐỐI KHÔNG CÓ NÚT LƯU:** Hệ thống áp dụng cơ chế Debounce (400ms) để tự động lưu ngầm nội dung khi gõ, kèm biểu tượng trạng thái trực quan (*"Đang lưu..."*, *"Đã lưu tự động"*).
4. **Xóa note bắt buộc có popup xác nhận (Confirmation Dialog):** Khi xóa bất kỳ ghi chú nào, hệ thống luôn hiển thị hộp thoại cảnh báo trước khi thực hiện.
5. **Live search (Tìm kiếm tức thì):** Tìm trong cả tiêu đề và nội dung, delay 300ms, không có nút Search. Kết hợp mượt mà với bộ lọc nhãn.

---

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Cài đặt các gói phụ thuộc (Dependencies):
```bash
npm install
```

### 2. Khởi chạy máy chủ phát triển (Development Server):
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

### 3. Build ứng dụng sản phẩm (Production Build):
```bash
npm run build
```

---

## 🔌 Hướng dẫn Tích hợp với Thành viên 2 (Backend, CSDL & WebSocket)

Frontend đã được thiết kế sẵn tầng kết nối linh hoạt tại thư mục `src/services/api.js` và `src/services/socket.js`.

1. Tạo file `.env` từ `.env.example`:
```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
2. Khi `VITE_USE_MOCK=false`, mọi thao tác sẽ tự động chuyển từ Mock / IndexedDB sang gọi API RESTful và WebSocket server của Backend.

---

## 📋 Danh sách các Tiêu chí Rubric Đã hoàn thành (Front-End)

| Nhóm | Tiêu chí Rubric | Mô tả thực hiện Front-end |
|---|---|---|
| **Phần 1: Tài khoản** | 1. User registration | Form đăng ký (email, display name, password x2), validate regex email, kiểm tra trùng mật khẩu, tự động đăng nhập. |
| | 2. Account activation | Banner thông báo tài khoản chưa kích hoạt nổi bật; banner tự động biến mất khi nhấn kích hoạt. |
| | 3. User login & logout | Form đăng nhập chuẩn, lưu token an toàn, Auth Guard chặn truy cập trái phép, đăng xuất xóa session. |
| | 4. Password reset | Luồng 3 bước: Nhập email -> Nhập mã OTP 6 số -> Nhập mật khẩu mới 2 lần, bắt login thủ công sau reset. |
| | 5. View profile & avatar | Hiển thị display name, email, avatar mặc định với chữ cái viết tắt tự nhiên khi chưa upload ảnh cá nhân. |
| | 6. Edit profile & avatar | Cho phép đổi tên và chọn ảnh mới, preview ảnh tức thì trước khi lưu. |
| | 7. Change password | Form nhập mật khẩu cũ + mật khẩu mới 2 lần để xác nhận chính xác. |
| | 8. User preferences | Tùy chỉnh kích thước font chữ ghi chú (nhỏ, vừa, lớn), bảng màu ghi chú, bật/tắt Light/Dark theme lưu LocalStorage. |
| **Phần 2: Quản lý ghi chú** | 9. Display notes listview | Hiển thị danh sách ghi chú theo dòng ngang (List view) ngay ngắn. |
| | 10. Display notes gridview | Hiển thị dạng lưới thẻ (Grid view) mặc định; nút chuyển đổi List/Grid mượt mà. |
| | 11. Create notes | Form tạo dùng chung màn hình với sửa note, chỉ bắt buộc nhập Tiêu đề & Nội dung. |
| | 12. Update notes | Cùng giao diện với tạo note, tải sẵn tiêu đề, nội dung, màu sắc, nhãn, đính kèm cũ. |
| | 13. Delete notes | Luôn hiển thị Confirmation Dialog cảnh báo trước khi xóa. |
| | 14. Auto-save notes | Tự động lưu ngầm khi gõ (debounce 400ms), tuyệt đối không có nút Lưu. |
| | 15. Attach images/video | Hỗ trợ đính kèm nhiều ảnh/video, hiển thị xem trước thumbnail và preview player. |
| | 16. Attach files | Hỗ trợ đính kèm tệp tài liệu (PDF, Word, TXT, ZIP...), cho phép tải về. |
| | 17. Pin notes to top | Note được ghim luôn nằm trên cùng, sắp xếp theo thời gian được ghim (pinned_at). |
| | 18. Status indicators | Hiển thị rõ ràng các biểu tượng nhận diện: Ghim (📌), Khóa (🔒), Được chia sẻ (👥) trên cả Grid và List. |
| | 19. Search notes (Live search) | Tìm kiếm theo thời gian thực cả tiêu đề và nội dung (debounce 300ms), không có nút Search. |
| | 20. Label management (CRUD) | Modal quản lý nhãn: Thêm, Đổi tên (tự cập nhật tất cả note liên quan), Xóa nhãn (không mất ghi chú). |
| | 21. Attach labels | Giao diện gắn/bỏ nhãn nhanh gọn ngay trên Note Editor. |
| | 22. Filter notes by label | Danh sách nhãn trên Sidebar; click vào nhãn nào thì chỉ hiển thị ghi chú thuộc nhãn đó (kết hợp với Live Search). |
| **Phần 3 & 4: Nâng cao** | 23. Enable/disable password | Mỗi note có mật khẩu riêng. Bật khóa: nhập 2 lần. Tắt khóa: bắt buộc nhập lại đúng mật khẩu hiện tại. |
| | 24. Password protection | Note bị khóa: che giấu nội dung, bắt prompt nhập mật khẩu trước khi xem/sửa/xóa. |
| | 25. Share and receive | Chia sẻ qua email, phân quyền Chỉ xem (Read-only) / Chỉnh sửa (Edit). Mục riêng *"Được chia sẻ với tôi"* trên Sidebar. |
| | 26. Collaboration realtime | Sẵn sàng kết nối WebSocket (Socket.io), phản ánh thay đổi trực tiếp giữa các người dùng cùng sửa. |
| | 29. UI/UX Design | Giao diện thân thiện, chuẩn trải nghiệm người dùng thực tế, có Skeleton loading, Empty states, Toast phản hồi. |
| | 30. Responsive Design | Tương thích và hiển thị tối ưu trên cả 3 loại thiết bị: Mobile (Drawer sidebar), Tablet và Desktop. |
| | 31. PWA & Offline | Service Worker cache static assets, IndexedDB lưu trữ ghi chú tại client, tự động nhận diện Online/Offline và đồng bộ. |
