import React, { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Trash2, Edit2, Check, X } from 'lucide-react';

export function LabelManagerModal() {
  const {
    labels,
    addLabel,
    renameLabel,
    deleteLabel,
    isLabelManagerOpen,
    setIsLabelManagerOpen
  } = useNotes();

  const { showSuccess, showError } = useToast();
  const [newLabelName, setNewLabelName] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingName, setEditingName] = useState('');

  if (!isLabelManagerOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed) return;
    if (labels.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) {
      showError('Tên nhãn đã tồn tại');
      return;
    }
    addLabel(trimmed);
    setNewLabelName('');
    showSuccess(`Đã tạo nhãn "${trimmed}"`);
  };

  const startEdit = (lbl) => {
    setEditingLabelId(lbl.id);
    setEditingName(lbl.name);
  };

  const handleSaveRename = (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    renameLabel(id, trimmed);
    setEditingLabelId(null);
    setEditingName('');
    showSuccess('Đã đổi tên nhãn và cập nhật các ghi chú liên quan');
  };

  const handleDelete = (id, name) => {
    deleteLabel(id);
    showSuccess(`Đã xóa nhãn "${name}" (ghi chú vẫn được giữ nguyên)`);
  };

  return (
    <Modal
      isOpen={isLabelManagerOpen}
      onClose={() => setIsLabelManagerOpen(false)}
      title="Chỉnh sửa nhãn"
      maxWidth="max-w-sm"
    >
      <div className="space-y-3">
        {/* Form thêm nhãn mới */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Tạo nhãn mới..."
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
          >
            Thêm
          </button>
        </form>

        {/* Danh sách nhãn */}
        <div className="max-h-56 overflow-y-auto space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {labels.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3 text-center">
              Chưa có nhãn nào.
            </p>
          ) : (
            labels.map((lbl) => {
              const isEditing = editingLabelId === lbl.id;

              return (
                <div
                  key={lbl.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-xs"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1.5 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-2 py-0.5 bg-white dark:bg-zinc-800 border border-blue-500 rounded text-xs focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(lbl.id)}
                        className="p-1 text-emerald-600 rounded"
                        title="Lưu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingLabelId(null)}
                        className="p-1 text-zinc-400 rounded"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate text-zinc-800 dark:text-zinc-200">
                        #{lbl.name}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(lbl)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                          title="Sửa tên"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lbl.id, lbl.name)}
                          className="p-1 text-zinc-400 hover:text-red-600 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={() => setIsLabelManagerOpen(false)}
            className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
