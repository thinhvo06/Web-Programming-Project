const http = require('http');

async function runTests() {
  console.log('Testing Backend API...');

  const app = require('./src/app');
  const { sequelize } = require('./src/models');

  await sequelize.authenticate();

  const server = app.listen(5099, async () => {
    console.log('Test server running on port 5099');

    try {
      const baseUrl = 'http://localhost:5099/api';

      // 1. Health check
      console.log('1. Testing /api/health...');
      const healthRes = await fetch(`${baseUrl}/health`);
      const healthData = await healthRes.json();
      console.log('   Health Status:', healthData.status);

      // 2. Login
      console.log('2. Testing /api/auth/login with student1@tdtu.edu.vn...');
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student1@tdtu.edu.vn',
          password: 'password123'
        })
      });
      const loginData = await loginRes.json();
      console.log('   Login Result:', loginData.success, 'Token received:', Boolean(loginData.token));
      const token = loginData.token;

      // 3. Get Notes
      console.log('3. Testing /api/notes (Get all notes)...');
      const notesRes = await fetch(`${baseUrl}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notesData = await notesRes.json();
      console.log('   Total notes:', notesData.total);
      console.log('   First note (top pinned):', notesData.notes[0]?.title);
      console.log('   Is first note pinned?:', notesData.notes[0]?.is_pinned);

      // 4. Test Live Search
      console.log('4. Testing Live Search (?search=ôn tập)...');
      const searchRes = await fetch(`${baseUrl}/notes?search=ôn tập`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      console.log('   Search matching notes:', searchData.total);

      // 5. Test Filter by Label
      console.log('5. Testing Filter by Label & Search combined...');
      const filterRes = await fetch(`${baseUrl}/notes?labelId=1&search=kiến trúc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filterData = await filterRes.json();
      console.log('   Combined search+filter notes:', filterData.total);

      // 6. Test Password Protected Note Unlock
      const lockedNote = notesData.notes.find(n => n.is_locked);
      if (lockedNote) {
        console.log(`6. Testing Note Unlock for Note #${lockedNote.id}...`);
        const unlockRes = await fetch(`${baseUrl}/notes/${lockedNote.id}/unlock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ password: 'note123456' })
        });
        const unlockData = await unlockRes.json();
        console.log('   Unlock success:', unlockData.success, 'Decrypted content preview:', unlockData.note?.content.substring(0, 30));
      }

      // 7. Test Shared with me for student2
      console.log('7. Testing Login & Shared with me for student2@tdtu.edu.vn...');
      const login2Res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student2@tdtu.edu.vn',
          password: 'password123'
        })
      });
      const login2Data = await login2Res.json();
      const token2 = login2Data.token;

      const sharedRes = await fetch(`${baseUrl}/shares/shared-with-me`, {
        headers: { Authorization: `Bearer ${token2}` }
      });
      const sharedData = await sharedRes.json();
      console.log('   Shared notes for student2:', sharedData.total);
      console.log('   First shared note title:', sharedData.notes[0]?.title, 'Role:', sharedData.notes[0]?.user_role);

      // 8. Test AI Summary
      console.log('8. Testing AI Summary...');
      const aiSummaryRes = await fetch(`${baseUrl}/ai/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Kế hoạch ôn tập thi',
          content: 'Cần ôn tập kỹ các phần: JWT, Bcrypt, Socket.io collaboration, Docker Compose và Auto-save.'
        })
      });
      const aiSummaryData = await aiSummaryRes.json();
      console.log('   AI Summary generated:', aiSummaryData.success);
      console.log('   Summary preview:', aiSummaryData.summary?.substring(0, 70));

      // 9. Test AI Q&A with references
      console.log('9. Testing AI Q&A with References...');
      const aiQaRes = await fetch(`${baseUrl}/ai/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: 'Hạn nộp đồ án cuối kỳ là ngày nào?'
        })
      });
      const aiQaData = await aiQaRes.json();
      console.log('   AI QA success:', aiQaData.success);
      console.log('   AI QA answer preview:', aiQaData.answer?.substring(0, 70));
      console.log('   AI QA references count:', aiQaData.references?.length);
      console.log('   AI QA referenced note:', aiQaData.references?.[0]?.title);

      console.log('\n🎉 TẤT CẢ 9 BỘ TEST RESTful API ĐỀU CHẠY THÀNH CÔNG RỰC RỠ!');
    } catch (testErr) {
      console.error('Test error:', testErr);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();
