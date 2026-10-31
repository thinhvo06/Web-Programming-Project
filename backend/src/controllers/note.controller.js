const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Note, Label, Attachment, NoteShare, User } = require('../models');

/**
 * Format note response with special status indicators
 */
function formatNoteResponse(note, currentUserId, unlockedNoteIds = []) {
  const plain = note.toJSON ? note.toJSON() : { ...note };

  const isOwner = plain.user_id === currentUserId;
  const isShared = (plain.shares && plain.shares.length > 0) || !isOwner;
  const isLocked = Boolean(plain.is_locked);
  const isUnlocked = isOwner && !isLocked || unlockedNoteIds.includes(plain.id);

  // If locked and not unlocked, hide content
  let safeContent = plain.content;
  if (isLocked && !isUnlocked) {
    safeContent = '🔒 Ghi chú đã được bảo vệ bằng mật khẩu.';
  }

  // Determine user role: 'owner', 'edit', 'read'
  let userRole = isOwner ? 'owner' : 'read';
  if (!isOwner && plain.shares && plain.shares.length > 0) {
    const share = plain.shares.find(s => s.shared_with_user_id === currentUserId);
    if (share) {
      userRole = share.permission;
    }
  }

  // Remove sensitive password hash from output
  delete plain.password_hash;

  return {
    ...plain,
    content: safeContent,
    is_locked: isLocked,
    is_unlocked: isUnlocked,
    is_pinned: Boolean(plain.is_pinned),
    is_shared: isShared,
    user_role: userRole,
    labels: plain.labels || [],
    attachments: plain.attachments || []
  };
}

/**
 * Tiêu chí 9, 10, 17, 18, 19, 22:
 * Get all notes with filters:
 * - search (title & content)
 * - labelId (filter by label)
 * - Pinned notes on top sorted by pinned_at DESC
 * - Non-pinned notes sorted by updated_at DESC
 */
async function getNotes(req, res, next) {
  try {
    const userId = req.user.id;
    const { search, labelId } = req.query;

    // Base conditions for owner's notes
    const whereConditions = {
      user_id: userId
    };

    // Live search in both title and content
    if (search && search.trim().length > 0) {
      const keyword = `%${search.trim()}%`;
      whereConditions[Op.or] = [
        { title: { [Op.like]: keyword } },
        { content: { [Op.like]: keyword } }
      ];
    }

    // Label filter condition
    const includeAssociations = [
      {
        model: Label,
        as: 'labels',
        through: { attributes: [] },
        ...(labelId ? { where: { id: parseInt(labelId, 10) } } : {})
      },
      {
        model: Attachment,
        as: 'attachments'
      },
      {
        model: NoteShare,
        as: 'shares',
        include: [{
          model: User,
          as: 'recipient',
          attributes: ['id', 'email', 'display_name', 'avatar_url']
        }]
      }
    ];

    // Order: Pinned notes first sorted by pinned_at DESC, then updated_at DESC
    const notes = await Note.findAll({
      where: whereConditions,
      include: includeAssociations,
      order: [
        ['is_pinned', 'DESC'],
        ['pinned_at', 'DESC'],
        ['updated_at', 'DESC']
      ]
    });

    const formattedNotes = notes.map(note => formatNoteResponse(note, userId));

    return res.status(200).json({
      success: true,
      total: formattedNotes.length,
      notes: formattedNotes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 11: Create note
 * Quy định đỏ: Chỉ có Tiêu đề & Nội dung là bắt buộc nhập!
 */
async function createNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, content, is_pinned, color, label_ids } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và Nội dung là thông tin bắt buộc phải nhập.'
      });
    }

    const newNote = await Note.create({
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      is_pinned: Boolean(is_pinned),
      pinned_at: is_pinned ? new Date() : null,
      color: color || 'default',
      is_locked: false,
      password_hash: null
    });

    // Attach labels if provided
    if (label_ids && Array.isArray(label_ids) && label_ids.length > 0) {
      await newNote.setLabels(label_ids);
    }

    // Reload note with associations
    const noteWithAssociations = await Note.findByPk(newNote.id, {
      include: [
        { model: Label, as: 'labels', through: { attributes: [] } },
        { model: Attachment, as: 'attachments' }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo ghi chú thành công!',
      note: formatNoteResponse(noteWithAssociations, userId, [newNote.id])
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single note by ID
 */
async function getNoteById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { password } = req.query; // optional password for locked notes

    const note = await Note.findByPk(id, {
      include: [
        { model: Label, as: 'labels', through: { attributes: [] } },
        { model: Attachment, as: 'attachments' },
        {
          model: NoteShare,
          as: 'shares',
          include: [{
            model: User,
            as: 'recipient',
            attributes: ['id', 'email', 'display_name', 'avatar_url']
          }]
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'display_name', 'avatar_url']
        }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú.'
      });
    }

    // Permission check: Must be owner OR recipient of shared note
    const isOwner = note.user_id === userId;
    const isSharedToUser = note.shares && note.shares.some(s => s.shared_with_user_id === userId);

    if (!isOwner && !isSharedToUser) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập ghi chú này.'
      });
    }

    // Check if unlocked with password
    let isUnlocked = false;
    if (note.is_locked) {
      if (password && note.password_hash) {
        isUnlocked = await bcrypt.compare(password, note.password_hash);
      }
    } else {
      isUnlocked = true;
    }

    return res.status(200).json({
      success: true,
      note: formatNoteResponse(note, userId, isUnlocked ? [note.id] : [])
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 12 & 14: Update Note & Auto-save
 * - Cùng 1 form với create note
 * - Hỗ trợ auto-save (debounced)
 */
async function updateNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content, is_pinned, color, label_ids } = req.body;

    const note = await Note.findByPk(id, {
      include: [{ model: NoteShare, as: 'shares' }]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú cần cập nhật.'
      });
    }

    // Permission check: Owner OR shared with 'edit' permission
    const isOwner = note.user_id === userId;
    const canEdit = isOwner || (note.shares && note.shares.some(s => s.shared_with_user_id === userId && s.permission === 'edit'));

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có quyền xem (Read-only), không thể chỉnh sửa ghi chú này.'
      });
    }

    // Update fields
    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (color !== undefined) note.color = color;

    // Pinning can only be toggled by the owner
    if (isOwner && is_pinned !== undefined) {
      const newPinState = Boolean(is_pinned);
      if (newPinState && !note.is_pinned) {
        note.is_pinned = true;
        note.pinned_at = new Date();
      } else if (!newPinState && note.is_pinned) {
        note.is_pinned = false;
        note.pinned_at = null;
      }
    }

    await note.save();

    // Update labels if provided and owner
    if (isOwner && label_ids !== undefined && Array.isArray(label_ids)) {
      await note.setLabels(label_ids);
    }

    const updatedNote = await Note.findByPk(id, {
      include: [
        { model: Label, as: 'labels', through: { attributes: [] } },
        { model: Attachment, as: 'attachments' },
        {
          model: NoteShare,
          as: 'shares',
          include: [{
            model: User,
            as: 'recipient',
            attributes: ['id', 'email', 'display_name', 'avatar_url']
          }]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật ghi chú thành công (Auto-save)!',
      note: formatNoteResponse(updatedNote, userId, [updatedNote.id])
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 13: Delete note
 * - Chỉ owner mới xóa được
 * - Nếu note bị khóa, kiểm tra password
 */
async function deleteNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { password } = req.body;

    const note = await Note.findByPk(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú để xóa.'
      });
    }

    if (note.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ chủ sở hữu ghi chú mới có quyền xóa ghi chú này.'
      });
    }

    // If password protected, require password
    if (note.is_locked && note.password_hash) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Ghi chú này đã được khóa. Vui lòng nhập mật khẩu ghi chú để xác nhận xóa.'
        });
      }
      const isMatch = await bcrypt.compare(password, note.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu ghi chú không chính xác. Không thể xóa ghi chú.'
        });
      }
    }

    await note.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa ghi chú thành công!'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 17: Pin / Unpin Note
 */
async function togglePin(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const note = await Note.findOne({ where: { id, user_id: userId } });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú của bạn.'
      });
    }

    note.is_pinned = !note.is_pinned;
    note.pinned_at = note.is_pinned ? new Date() : null;
    await note.save();

    return res.status(200).json({
      success: true,
      message: note.is_pinned ? 'Đã ghim ghi chú lên đầu!' : 'Đã bỏ ghim ghi chú.',
      is_pinned: note.is_pinned,
      pinned_at: note.pinned_at
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 23: Enable Password (Lock Note)
 * - Nhập pass 2 lần để chống gõ sai
 * - Băm pass bằng bcrypt
 */
async function lockNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { password, confirm_password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu để khóa ghi chú.'
      });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp.'
      });
    }

    const note = await Note.findOne({ where: { id, user_id: userId } });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    note.password_hash = await bcrypt.hash(password, salt);
    note.is_locked = true;
    await note.save();

    return res.status(200).json({
      success: true,
      message: 'Đã bật bảo vệ mật khẩu cho ghi chú thành công!',
      is_locked: true
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 23: Disable Password (Unlock permanently)
 * - Bắt buộc nhập lại đúng password hiện tại để xác nhận hủy bảo vệ
 */
async function disableLock(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { current_password } = req.body;

    if (!current_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại của ghi chú để hủy bảo vệ.'
      });
    }

    const note = await Note.findOne({ where: { id, user_id: userId } });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.'
      });
    }

    if (!note.is_locked || !note.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú này hiện không được cài mật khẩu.'
      });
    }

    const isMatch = await bcrypt.compare(current_password, note.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu ghi chú không chính xác. Không thể hủy bảo vệ.'
      });
    }

    note.is_locked = false;
    note.password_hash = null;
    await note.save();

    return res.status(200).json({
      success: true,
      message: 'Đã hủy bảo vệ mật khẩu ghi chú thành công!',
      is_locked: false
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 24: Unlock note (Temporary verification to view/edit)
 */
async function unlockNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu của ghi chú.'
      });
    }

    const note = await Note.findByPk(id, {
      include: [
        { model: Label, as: 'labels', through: { attributes: [] } },
        { model: Attachment, as: 'attachments' },
        {
          model: NoteShare,
          as: 'shares',
          include: [{
            model: User,
            as: 'recipient',
            attributes: ['id', 'email', 'display_name', 'avatar_url']
          }]
        }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú.'
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

    if (!note.is_locked || !note.password_hash) {
      return res.status(200).json({
        success: true,
        message: 'Ghi chú này không bị khóa.',
        note: formatNoteResponse(note, userId, [note.id])
      });
    }

    const isMatch = await bcrypt.compare(password, note.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu ghi chú không chính xác.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mở khóa ghi chú thành công!',
      note: formatNoteResponse(note, userId, [note.id])
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 24: Change lock password of note
 * - Nhập pass cũ + pass mới 2 lần
 */
async function changeLockPassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.'
      });
    }

    if (confirm_password && new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới xác nhận không khớp.'
      });
    }

    const note = await Note.findOne({ where: { id, user_id: userId } });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.'
      });
    }

    if (!note.is_locked || !note.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú này chưa được cài mật khẩu.'
      });
    }

    const isMatch = await bcrypt.compare(current_password, note.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại của ghi chú không chính xác.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    note.password_hash = await bcrypt.hash(new_password, salt);
    await note.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu ghi chú thành công!'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  togglePin,
  lockNote,
  disableLock,
  unlockNote,
  changeLockPassword
};
