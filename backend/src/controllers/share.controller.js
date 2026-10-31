const { NoteShare, Note, User, Label, Attachment } = require('../models');
const { sendNoteSharedEmail } = require('../config/mailer');

/**
 * Tiêu chí 25: Share Note to another user by email
 */
async function shareNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params; // note id
    const { email, permission } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email người nhận.'
      });
    }

    const validPermissions = ['read', 'edit'];
    const chosenPerm = validPermissions.includes(permission) ? permission : 'read';

    // Verify note ownership
    const note = await Note.findOne({ where: { id, user_id: userId } });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu ghi chú này.'
      });
    }

    // Validate recipient user exists
    const recipient = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng với email này trong hệ thống.'
      });
    }

    // Cannot share to oneself
    if (recipient.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự chia sẻ ghi chú cho chính mình.'
      });
    }

    // Check if already shared
    let shareRecord = await NoteShare.findOne({
      where: { note_id: id, shared_with_user_id: recipient.id }
    });

    if (shareRecord) {
      shareRecord.permission = chosenPerm;
      await shareRecord.save();
    } else {
      shareRecord = await NoteShare.create({
        note_id: id,
        shared_with_user_id: recipient.id,
        permission: chosenPerm
      });
    }

    // Send email notification via SMTP
    sendNoteSharedEmail(recipient, req.user, note, chosenPerm).catch(err => {
      console.error('[ShareNote] Error sending share email notification:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: `Đã chia sẻ ghi chú thành công cho ${recipient.display_name} (${recipient.email}) với quyền ${chosenPerm === 'edit' ? 'Chỉnh sửa' : 'Chỉ xem'}.`,
      share: {
        id: shareRecord.id,
        note_id: note.id,
        recipient: {
          id: recipient.id,
          email: recipient.email,
          display_name: recipient.display_name,
          avatar_url: recipient.avatar_url || '/public/default-avatar.svg'
        },
        permission: shareRecord.permission,
        shared_at: shareRecord.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 25: Get "Shared with me" notes
 * Hiển thị: ai chia sẻ, ngày chia sẻ, quyền hạn (read-only/edit)
 */
async function getSharedWithMeNotes(req, res, next) {
  try {
    const userId = req.user.id;

    const shares = await NoteShare.findAll({
      where: { shared_with_user_id: userId },
      include: [
        {
          model: Note,
          as: 'note',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'email', 'display_name', 'avatar_url']
            },
            {
              model: Label,
              as: 'labels',
              through: { attributes: [] }
            },
            {
              model: Attachment,
              as: 'attachments'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const sharedNotes = shares
      .filter(s => s.note !== null) // ensure note wasn't deleted
      .map(s => {
        const plainNote = s.note.toJSON();
        delete plainNote.password_hash;

        return {
          ...plainNote,
          is_shared: true,
          user_role: s.permission, // 'read' or 'edit'
          shared_info: {
            share_id: s.id,
            permission: s.permission,
            shared_at: s.createdAt,
            shared_by: s.note.owner
          }
        };
      });

    return res.status(200).json({
      success: true,
      total: sharedNotes.length,
      notes: sharedNotes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 25: Get all recipients a note is shared with (for note owner)
 */
async function getNoteShares(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params; // note id

    const note = await Note.findOne({ where: { id, user_id: userId } });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.'
      });
    }

    const shares = await NoteShare.findAll({
      where: { note_id: id },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'email', 'display_name', 'avatar_url']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      shares: shares.map(s => ({
        id: s.id,
        recipient: s.recipient,
        permission: s.permission,
        shared_at: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 25: Update share permission (Owner can update read <=> edit)
 */
async function updateSharePermission(req, res, next) {
  try {
    const userId = req.user.id;
    const { shareId } = req.params;
    const { permission } = req.body;

    const validPermissions = ['read', 'edit'];
    if (!validPermissions.includes(permission)) {
      return res.status(400).json({
        success: false,
        message: 'Quyền hạn không hợp lệ. Chỉ chấp nhận "read" hoặc "edit".'
      });
    }

    const share = await NoteShare.findByPk(shareId, {
      include: [{ model: Note, as: 'note' }]
    });

    if (!share || !share.note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin chia sẻ.'
      });
    }

    if (share.note.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ chủ sở hữu ghi chú mới có quyền thay đổi quyền truy cập.'
      });
    }

    share.permission = permission;
    await share.save();

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật quyền thành "${permission === 'edit' ? 'Chỉnh sửa' : 'Chỉ xem'}"!`,
      share: {
        id: share.id,
        permission: share.permission
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 25: Revoke sharing (Owner removes recipient access)
 */
async function revokeShare(req, res, next) {
  try {
    const userId = req.user.id;
    const { shareId } = req.params;

    const share = await NoteShare.findByPk(shareId, {
      include: [{ model: Note, as: 'note' }]
    });

    if (!share || !share.note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin chia sẻ.'
      });
    }

    if (share.note.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ chủ sở hữu ghi chú mới có quyền thu hồi chia sẻ.'
      });
    }

    await share.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã thu hồi quyền chia sẻ ghi chú thành công!'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  shareNote,
  getSharedWithMeNotes,
  getNoteShares,
  updateSharePermission,
  revokeShare
};
