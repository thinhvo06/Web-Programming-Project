import React from 'react';

/**
 * Thành phần đánh dấu (highlight) từ khóa tìm kiếm trong tiêu đề và nội dung (Tiêu chí 19)
 * Highlight chính xác đúng phần từ khóa, loại bỏ triệt để padding/margin để không gây lệch hoặc chèn khoảng cách chữ
 */
export function HighlightText({ text = '', query = '' }) {
  if (!query || !query.trim() || !text) {
    return <span>{text}</span>;
  }

  const trimmed = query.trim();
  const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matchRegex = new RegExp(`^${escapedQuery}$`, 'i');
  const splitRegex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(splitRegex);

  return (
    <span>
      {parts.map((part, i) =>
        matchRegex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200 dark:bg-amber-900/60 text-zinc-900 dark:text-zinc-100 font-semibold inline"
            style={{ padding: 0, margin: 0, borderRadius: 0 }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
