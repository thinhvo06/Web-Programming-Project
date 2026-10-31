const { Note, NoteShare } = require('../models');
const { generateSummary, answerQuestionWithNotes } = require('../config/gemini');

/**
 * Tiêu chí 27: AI Summary
 * Tóm tắt 1 ghi chú bằng LLM (Gemini API), hỗ trợ "Tạo lại tóm tắt" (Regenerate)
 */
async function summarizeNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { noteId, content, title } = req.body;

    let targetTitle = title || '';
    let targetContent = content || '';

    // If noteId is provided, fetch from DB and check permissions
    if (noteId) {
      const note = await Note.findByPk(noteId, {
        include: [{ model: NoteShare, as: 'shares' }]
      });

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ghi chú để tóm tắt.'
        });
      }

      const isOwner = note.user_id === userId;
      const isShared = note.shares && note.shares.some(s => s.shared_with_user_id === userId);
      if (!isOwner && !isShared) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập ghi chú này.'
        });
      }

      targetTitle = note.title;
      targetContent = note.content;
    }

    if (!targetContent || targetContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung ghi chú trống, không thể thực hiện tóm tắt.'
      });
    }

    const summary = await generateSummary(targetTitle, targetContent);

    return res.status(200).json({
      success: true,
      summary,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 28: AI Question & Answer
 * - Hỏi đáp tự nhiên về toàn bộ ghi chú của user
 * - Truy vấn các note liên quan, tổng hợp câu trả lời
 * - BẮT BUỘC hiển thị trích dẫn (references) note để click mở trực tiếp
 */
async function askQuestion(req, res, next) {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi của bạn.'
      });
    }

    // 1. Fetch all notes owned by user
    const ownedNotes = await Note.findAll({
      where: { user_id: userId, is_locked: false }, // avoid leaking locked notes
      attributes: ['id', 'title', 'content', 'updated_at']
    });

    // 2. Fetch notes shared with user
    const sharedRecords = await NoteShare.findAll({
      where: { shared_with_user_id: userId },
      include: [{
        model: Note,
        as: 'note',
        where: { is_locked: false },
        attributes: ['id', 'title', 'content', 'updated_at']
      }]
    });

    const sharedNotes = sharedRecords.map(s => s.note).filter(Boolean);

    // Combine notes
    const allAvailableNotes = [...ownedNotes, ...sharedNotes];

    // 3. Ask Gemini with full context
    const result = await answerQuestionWithNotes(question.trim(), allAvailableNotes);

    return res.status(200).json({
      success: true,
      question: question.trim(),
      answer: result.answer,
      references: result.references, // array of { id, title }
      total_references: result.references.length
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  summarizeNote,
  askQuestion
};
