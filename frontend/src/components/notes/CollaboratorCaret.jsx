import React, { useState, useEffect, useCallback } from 'react';
import { getSelectionCoordinates } from '../../utils/caretCoordinates';

/**
 * Hiển thị con trỏ (Caret / Pointer) và VÙNG CHỌN CHỮ (Text Selection)
 * của người cộng tác trực tiếp tại vị trí ký tự theo chuẩn Google Docs/Sheets:
 * 1. Các khối hình chữ nhật màu bán trong suốt phủ lên chữ được bôi đen
 * 2. Thanh dọc (caret bar) nhấp nháy theo màu riêng của người dùng
 * 3. Cờ tên người dùng (name flag) nổi ở đầu con trỏ với màu đồng bộ
 */
export function CollaboratorCaret({ targetRef, cursor, text }) {
  const [coords, setCoords] = useState(null);

  const updateCoordinates = useCallback(() => {
    const el = targetRef.current;
    if (!el || cursor.position === undefined) {
      setCoords(null);
      return;
    }

    try {
      const { caret, rects } = getSelectionCoordinates(
        el,
        cursor.selectionStart,
        cursor.selectionEnd,
        cursor.position
      );

      const caretLeft = caret.left - el.scrollLeft;
      const caretTop = caret.top - el.scrollTop;

      const isVisible =
        caretTop >= -caret.height &&
        caretTop <= el.clientHeight + 40 &&
        caretLeft >= -100 &&
        caretLeft <= el.clientWidth + 100;

      const visibleRects = (rects || []).map((r) => ({
        left: r.left - el.scrollLeft,
        top: r.top - el.scrollTop,
        width: r.width,
        height: r.height
      }));

      setCoords({
        caret: {
          left: Math.max(0, caretLeft),
          top: caretTop,
          height: caret.height || 22,
          isTopClipped: caretTop < 24
        },
        rects: visibleRects,
        isVisible
      });
    } catch {
      setCoords(null);
    }
  }, [targetRef, cursor.position, cursor.selectionStart, cursor.selectionEnd]);

  useEffect(() => {
    updateCoordinates();

    const el = targetRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateCoordinates, { passive: true });
    window.addEventListener('resize', updateCoordinates);

    return () => {
      el.removeEventListener('scroll', updateCoordinates);
      window.removeEventListener('resize', updateCoordinates);
    };
  }, [updateCoordinates, text]);

  if (!coords || !coords.isVisible) return null;

  const hexColor = cursor.color?.hex || '#2563eb';
  const displayName = cursor.user?.display_name || cursor.user?.email || 'Cộng tác viên';

  return (
    <>
      {/* 1. Các khối chữ nhật bôi đen văn bản (Google Docs/Sheets Selection Highlighting) */}
      {coords.rects && coords.rects.map((r, idx) => (
        <div
          key={`collab-sel-${idx}`}
          className="absolute pointer-events-none rounded-xs select-none transition-all duration-75 z-20"
          style={{
            left: `${r.left}px`,
            top: `${r.top}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
            backgroundColor: `${hexColor}35`,
            boxShadow: `inset 0 0 0 1px ${hexColor}50`,
          }}
        />
      ))}

      {/* 2. Con trỏ và cờ tên người dùng */}
      <div
        className="absolute pointer-events-none z-30 transition-all duration-75 ease-out select-none"
        style={{
          left: `${coords.caret.left}px`,
          top: `${coords.caret.top}px`,
          height: `${coords.caret.height}px`,
        }}
      >
        {/* Thanh con trỏ Google Sheets / Docs thẳng đứng */}
        <div
          className="w-[2.5px] h-full rounded-xs shadow-xs animate-collab-blink"
          style={{
            backgroundColor: hexColor,
            boxShadow: `0 0 5px ${hexColor}99`,
          }}
        />

        {/* Cờ tên người dùng (Google Sheets Name Tab / Flag) */}
        <div
          className={`absolute left-0 flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-bold text-white shadow-md whitespace-nowrap select-none origin-bottom-left transition-transform ${
            coords.caret.isTopClipped
              ? 'top-full mt-[2px] rounded-b-md rounded-tr-md'
              : 'bottom-full mb-[2px] rounded-t-md rounded-br-md'
          }`}
          style={{
            backgroundColor: hexColor,
            boxShadow: `0 2px 6px -1px ${hexColor}80`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/95 animate-ping" />
          <span className="leading-tight drop-shadow-xs">{displayName}</span>

          {/* Mũi tên nhỏ định hướng Google Sheets */}
          {coords.caret.isTopClipped ? (
            <div
              className="absolute -top-[3px] left-0 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[3px]"
              style={{ borderBottomColor: hexColor }}
            />
          ) : (
            <div
              className="absolute -bottom-[3px] left-0 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px]"
              style={{ borderTopColor: hexColor }}
            />
          )}
        </div>
      </div>
    </>
  );
}
