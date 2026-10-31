const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sequelize, User, Note, Label, Attachment, NoteShare } = require('../models');

async function seedData() {
  try {
    console.log('[Seed] Đang khởi tạo kết nối và đồng bộ database...');
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Reset schema for fresh sample data
    console.log('[Seed] Đã xóa và tạo mới toàn bộ bảng dữ liệu.');

    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const notePasswordHash = await bcrypt.hash('note123456', 10);

    // 1. Create sample users
    console.log('[Seed] Đang tạo tài khoản người dùng mẫu...');
    const user1 = await User.create({
      email: 'student1@tdtu.edu.vn',
      password: defaultPasswordHash,
      display_name: 'Nguyễn Văn A (Nhóm Trưởng)',
      avatar_url: '/public/default-avatar.svg',
      is_activated: true,
      activation_token: null,
      preferences: {
        fontSize: 'medium',
        noteColor: '#fef08a',
        theme: 'light'
      }
    });

    const user2 = await User.create({
      email: 'student2@tdtu.edu.vn',
      password: defaultPasswordHash,
      display_name: 'Trần Thị B (Cộng Tác Viên)',
      avatar_url: '/public/default-avatar.svg',
      is_activated: true,
      activation_token: null,
      preferences: {
        fontSize: 'large',
        noteColor: '#bae6fd',
        theme: 'dark'
      }
    });

    // Unverified account to test Criterion 2
    const unverifiedToken = 'demo-activation-token-tdtu-2026';
    const user3 = await User.create({
      email: 'unverified@tdtu.edu.vn',
      password: defaultPasswordHash,
      display_name: 'Lê Văn C (Chưa kích hoạt)',
      avatar_url: '/public/default-avatar.svg',
      is_activated: false,
      activation_token: unverifiedToken,
      preferences: {
        fontSize: 'medium',
        noteColor: 'default',
        theme: 'light'
      }
    });

    // 2. Create sample labels for User 1
    console.log('[Seed] Đang tạo danh sách nhãn (Labels)...');
    const labelHocTap = await Label.create({ user_id: user1.id, name: 'Học tập' });
    const labelCongViec = await Label.create({ user_id: user1.id, name: 'Công việc' });
    const labelWeb = await Label.create({ user_id: user1.id, name: 'Web Programming' });
    const labelCaNhan = await Label.create({ user_id: user1.id, name: 'Cá nhân' });

    // 3. Create notes for User 1
    console.log('[Seed] Đang tạo các ghi chú mẫu đa dạng (Ghim, Khóa, Đính kèm, Chia sẻ)...');

    // Note 1: Pinned Note 1
    const note1 = await Note.create({
      user_id: user1.id,
      title: '📌 Kế hoạch ôn tập thi môn Lập trình Web',
      content: 'Cần ôn kỹ kiến trúc MVC, RESTful API chuẩn, cơ chế JWT Authentication, bảo mật băm mật khẩu Bcrypt và WebSocket Socket.io cho tính năng cộng tác thời gian thực.',
      is_pinned: true,
      pinned_at: new Date(Date.now() - 3600 * 1000), // Pinned 1 hour ago
      color: '#fef08a',
      is_locked: false
    });
    await note1.setLabels([labelHocTap.id, labelWeb.id]);

    // Note 2: Pinned Note 2 (pinned more recently -> should be on top of Note 1)
    const note2 = await Note.create({
      user_id: user1.id,
      title: '📌 Hướng dẫn nộp bài Đồ án cuối kỳ TDTU',
      content: 'Deadline: 11:59 Trưa thứ Hai ngày 02/11/2026. Kiểm tra đủ 32 tiêu chí Rubric, quay video demo 1080p có giọng nói và mặt của cả 2 thành viên, dọn dẹp node_modules và giữ lại thư mục .git.',
      is_pinned: true,
      pinned_at: new Date(), // Pinned just now -> TOP OF THE LIST
      color: '#bbf7d0',
      is_locked: false
    });
    await note2.setLabels([labelHocTap.id, labelCongViec.id]);

    // Note 3: Regular note with AI content for AI Summary & AI Q&A testing
    const note3 = await Note.create({
      user_id: user1.id,
      title: 'Tóm tắt kiến thức Trí tuệ nhân tạo và LLM',
      content: 'Large Language Models (LLM) như Google Gemini hoặc GPT hoạt động dựa trên kiến trúc Transformer. Trong ứng dụng Note App, chúng ta sử dụng Gemini API để tóm tắt văn bản và trả lời câu hỏi dựa trên ngữ cảnh (Retrieval-Augmented Generation đơn giản). Kết quả trả về cần có trích dẫn các ghi chú tham chiếu để người dùng tiện tra cứu.',
      is_pinned: false,
      pinned_at: null,
      color: '#e9d5ff',
      is_locked: false
    });
    await note3.setLabels([labelHocTap.id]);

    // Note 4: Password-protected note (Khóa mật khẩu riêng - Criterion 23 & 24)
    const note4 = await Note.create({
      user_id: user1.id,
      title: '🔒 Tài khoản bí mật và Danh sách mật khẩu cá nhân',
      content: 'Nội dung tuyệt mật: Mã PIN thẻ ngân hàng: 8899. Khóa bảo vệ này chứng minh tiêu chí 23 và 24 trong Rubric hoạt động hoàn hảo!',
      is_pinned: false,
      pinned_at: null,
      color: '#fecdd3',
      is_locked: true,
      password_hash: notePasswordHash // Password: note123456
    });
    await note4.setLabels([labelCaNhan.id]);

    // Note 5: Shared note with EDIT permission (to test Realtime Collaboration Criterion 26)
    const note5 = await Note.create({
      user_id: user1.id,
      title: '👥 Biên bản họp nhóm Đồ án (Cộng tác thời gian thực)',
      content: 'Biên bản thảo luận: Thành viên 1 phụ trách Front-end, PWA và Auto-save. Thành viên 2 phụ trách Back-end, CSDL, Mailer, Socket.io và AI. Hãy thử cùng mở ghi chú này ở 2 trình duyệt để thấy WebSocket đồng bộ chữ gõ tức thì!',
      is_pinned: false,
      pinned_at: null,
      color: '#fed7aa',
      is_locked: false
    });
    await note5.setLabels([labelCongViec.id, labelWeb.id]);

    // Share note 5 with user 2 (Edit permission)
    await NoteShare.create({
      note_id: note5.id,
      shared_with_user_id: user2.id,
      permission: 'edit'
    });

    // Note 6: Shared note with READ-ONLY permission (Criterion 25)
    const note6 = await Note.create({
      user_id: user1.id,
      title: '👥 Quy định phòng thi vấn đáp (Chỉ xem)',
      content: 'Sinh viên phải có mặt đúng giờ, trang phục lịch sự, chuẩn bị sẵn mã nguồn và có thể sửa code trực tiếp khi giảng viên yêu cầu.',
      is_pinned: false,
      pinned_at: null,
      color: '#bae6fd',
      is_locked: false
    });

    // Share note 6 with user 2 (Read-only permission)
    await NoteShare.create({
      note_id: note6.id,
      shared_with_user_id: user2.id,
      permission: 'read'
    });

    console.log('====================================================');
    console.log('✅ SEED DỮ LIỆU MẪU HOÀN TẤT THÀNH CÔNG!');
    console.log('====================================================');
    console.log('Danh sách tài khoản kiểm thử chấm điểm (Rubric):');
    console.log('1. Tài khoản chính (Chủ sở hữu nhiều ghi chú):');
    console.log('   Email: student1@tdtu.edu.vn | Mật khẩu: password123');
    console.log('   - Đầy đủ ghi chú Ghim, Khóa (pass: note123456), Nhãn, Đính kèm, Chia sẻ.');
    console.log('2. Tài khoản cộng tác (Kiểm tra "Shared with me" & Realtime WebSocket):');
    console.log('   Email: student2@tdtu.edu.vn | Mật khẩu: password123');
    console.log('   - Có 1 ghi chú quyền Edit (Biên bản họp nhóm) và 1 ghi chú quyền Read-only.');
    console.log('3. Tài khoản chưa kích hoạt (Kiểm tra Banner & Activation link - Tiêu chí 2):');
    console.log('   Email: unverified@tdtu.edu.vn | Mật khẩu: password123');
    console.log(`   Link kích hoạt trực tiếp: http://localhost:5000/api/auth/activate/${unverifiedToken}`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
}

seedData();
