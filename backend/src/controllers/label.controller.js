const { Label, Note, NoteLabel } = require('../models');

/**
 * Tiêu chí 20: Get all labels of current user
 */
async function getLabels(req, res, next) {
  try {
    const userId = req.user.id;
    const labels = await Label.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      labels
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 20: Create Label
 */
async function createLabel(req, res, next) {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhãn không được để trống.'
      });
    }

    const trimmedName = name.trim();

    // Check existing
    const existing = await Label.findOne({
      where: { user_id: userId, name: trimmedName }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Nhãn này đã tồn tại trong danh sách của bạn.'
      });
    }

    const label = await Label.create({
      user_id: userId,
      name: trimmedName
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo nhãn mới thành công!',
      label
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 20: Rename Label
 * Yêu cầu: Đổi tên nhãn thì mọi note liên quan tự động cập nhật tên mới
 */
async function updateLabel(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhãn mới không được để trống.'
      });
    }

    const label = await Label.findOne({ where: { id, user_id: userId } });
    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhãn cần sửa.'
      });
    }

    label.name = name.trim();
    await label.save();

    return res.status(200).json({
      success: true,
      message: 'Đổi tên nhãn thành công! Mọi ghi chú liên quan đã được tự động cập nhật.',
      label
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 20: Delete Label
 * Lưu ý cốt lõi: Xóa nhãn KHÔNG mất note (chỉ xóa liên kết trong bảng NoteLabel)
 */
async function deleteLabel(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const label = await Label.findOne({ where: { id, user_id: userId } });
    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhãn cần xóa.'
      });
    }

    // Delete associations in note_labels
    await NoteLabel.destroy({ where: { label_id: id } });

    // Delete label itself
    await label.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa nhãn thành công! Các ghi chú vẫn được giữ nguyên vẹn.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tiêu chí 21: Attach / Detach labels to a note
 */
async function setNoteLabels(req, res, next) {
  try {
    const userId = req.user.id;
    const { noteId } = req.params;
    const { label_ids } = req.body;

    const note = await Note.findOne({ where: { id: noteId, user_id: userId } });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không có quyền sửa nhãn.'
      });
    }

    if (!Array.isArray(label_ids)) {
      return res.status(400).json({
        success: false,
        message: 'label_ids phải là một danh sách các id nhãn.'
      });
    }

    await note.setLabels(label_ids);

    const updatedNote = await Note.findByPk(noteId, {
      include: [{ model: Label, as: 'labels', through: { attributes: [] } }]
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật nhãn cho ghi chú thành công!',
      labels: updatedNote.labels
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  setNoteLabels
};
