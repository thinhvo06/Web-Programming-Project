const path = require('path');
const fs = require('fs');
const { Attachment, Note, NoteShare } = require('../models');

/**
 * Determine file type category ('image', 'video', 'file')
 */
function categorizeFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

/**
 * Tiêu chí 15 & 16: Upload attachments to note
 */
async function uploadNoteAttachments(req, res, next) {
  try {
    const userId = req.user.id;
    const { noteId } = req.params;

    const note = await Note.findByPk(noteId, {
      include: [{ model: NoteShare, as: 'shares' }]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú.'
      });
    }

    // Must be owner OR shared editor
    const isOwner = note.user_id === userId;
    const canEdit = isOwner || (note.shares && note.shares.some(s => s.shared_with_user_id === userId && s.permission === 'edit'));

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đính kèm file vào ghi chú này.'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có file nào được tải lên.'
      });
    }

    const createdAttachments = [];

    for (const file of req.files) {
      const fileType = categorizeFileType(file.mimetype);
      const relativePath = `/uploads/attachments/${file.filename}`;

      const attachment = await Attachment.create({
        note_id: note.id,
        file_name: file.filename,
        original_name: Buffer.from(file.originalname, 'latin1').toString('utf8'), // fix UTF-8 encoding
        file_type: fileType,
        mime_type: file.mimetype,
        file_size: file.size,
        file_path: relativePath
      });

      createdAttachments.push(attachment);
    }

    return res.status(201).json({
      success: true,
      message: `Đã tải lên thành công ${createdAttachments.length} tệp đính kèm!`,
      attachments: createdAttachments
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 16: Download attachment file
 */
async function downloadAttachment(req, res, next) {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findByPk(id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tệp đính kèm.'
      });
    }

    const filePath = path.resolve(__dirname, '../../uploads/attachments', attachment.file_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Tệp tin không còn tồn tại trên máy chủ.'
      });
    }

    return res.download(filePath, attachment.original_name);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete attachment
 */
async function deleteAttachment(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const attachment = await Attachment.findByPk(id, {
      include: [{
        model: Note,
        include: [{ model: NoteShare, as: 'shares' }]
      }]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tệp đính kèm cần xóa.'
      });
    }

    const note = attachment.Note;
    const isOwner = note && note.user_id === userId;
    const canEdit = isOwner || (note && note.shares && note.shares.some(s => s.shared_with_user_id === userId && s.permission === 'edit'));

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa tệp đính kèm này.'
      });
    }

    // Delete physical file
    const filePath = path.resolve(__dirname, '../../uploads/attachments', attachment.file_name);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete physical file:', e.message);
      }
    }

    await attachment.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa tệp đính kèm thành công!'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadNoteAttachments,
  downloadAttachment,
  deleteAttachment
};
