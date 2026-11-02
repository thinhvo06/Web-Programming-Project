/**
 * Helper tính toán tọa độ pixel (top, left, width, height) của con trỏ (caret)
 * và vùng bôi đen chọn chữ (text selection) bên trong <input> hoặc <textarea>
 * theo chuẩn Google Docs/Sheets.
 *
 * Dựa trên kỹ thuật DOM Mirroring kết hợp getClientRects().
 */

const properties = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize'
];

const isBrowser = typeof window !== 'undefined';
const isFirefox = isBrowser && window.mozInnerScreenX != null;

/**
 * Đo lường vị trí con trỏ và danh sách các khối chữ nhật bôi đen (selection rects)
 */
export function getSelectionCoordinates(element, rawStart, rawEnd, rawPos) {
  if (!isBrowser || !element) {
    return { caret: { top: 0, left: 0, height: 20 }, rects: [] };
  }

  const val = element.value || '';
  const isInput = element.nodeName === 'INPUT';
  const len = val.length;

  const s = rawStart !== undefined ? rawStart : (rawPos || 0);
  const e = rawEnd !== undefined ? rawEnd : (rawPos || 0);
  const selStart = Math.max(0, Math.min(Math.min(s, e), len));
  const selEnd = Math.max(0, Math.min(Math.max(s, e), len));
  const caretIndex = rawPos !== undefined
    ? Math.max(0, Math.min(rawPos, len))
    : selEnd;

  // Tái sử dụng hoặc tạo mirror div
  let div = document.getElementById('collab-caret-position-mirror-div');
  if (!div) {
    div = document.createElement('div');
    div.id = 'collab-caret-position-mirror-div';
    document.body.appendChild(div);
  }

  const style = div.style;
  const computed = window.getComputedStyle(element);

  // Thiết lập mirror div nằm ngoài màn hình
  style.position = 'absolute';
  style.top = '0';
  style.left = '-99999px';
  style.visibility = 'hidden';
  style.pointerEvents = 'none';

  // Sao chép toàn bộ font, padding, border của element sang div
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    style[prop] = computed[prop];
  }

  if (isFirefox) {
    if (element.scrollHeight > parseInt(computed.height, 10)) {
      style.overflowY = 'scroll';
    }
  } else {
    style.overflow = 'hidden';
  }

  style.whiteSpace = isInput ? 'nowrap' : 'pre-wrap';
  if (!isInput) {
    style.wordWrap = 'break-word';
  }

  div.textContent = '';

  const rawLineHeight = parseInt(computed.lineHeight || '0', 10);
  const rawFontSize = parseInt(computed.fontSize || '16', 10);
  const defaultLineHeight = rawLineHeight > 0 ? rawLineHeight : Math.round(rawFontSize * 1.4);

  // 1. Trường hợp con trỏ đơn (không bôi đen chữ)
  if (selStart === selEnd) {
    let before = val.substring(0, caretIndex);
    if (isInput) before = before.replace(/\s/g, '\u00a0');
    div.appendChild(document.createTextNode(before));

    const caretSpan = document.createElement('span');
    caretSpan.textContent = '\u200b'; // Zero-width space
    div.appendChild(caretSpan);

    let after = val.substring(caretIndex);
    if (isInput) after = after.replace(/\s/g, '\u00a0');
    div.appendChild(document.createTextNode(after));

    const divRect = div.getBoundingClientRect();
    const cRect = caretSpan.getBoundingClientRect();

    return {
      caret: {
        top: cRect.top - divRect.top,
        left: cRect.left - divRect.left,
        height: cRect.height || defaultLineHeight
      },
      rects: []
    };
  }

  // 2. Trường hợp có vùng bôi đen (Selection Range)
  let beforeText = val.substring(0, selStart);
  if (isInput) beforeText = beforeText.replace(/\s/g, '\u00a0');
  div.appendChild(document.createTextNode(beforeText));

  const selSpan = document.createElement('span');
  let selText = val.substring(selStart, selEnd);
  if (isInput) selText = selText.replace(/\s/g, '\u00a0');
  selSpan.textContent = selText;
  div.appendChild(selSpan);

  const caretSpan = document.createElement('span');
  caretSpan.textContent = '\u200b';

  if (caretIndex === selStart) {
    div.insertBefore(caretSpan, selSpan);
  } else {
    div.appendChild(caretSpan);
  }

  let afterText = val.substring(selEnd);
  if (isInput) afterText = afterText.replace(/\s/g, '\u00a0');
  div.appendChild(document.createTextNode(afterText));

  const divRect = div.getBoundingClientRect();
  const cRect = caretSpan.getBoundingClientRect();
  const clientRects = selSpan.getClientRects();
  const rects = [];

  for (let i = 0; i < clientRects.length; i++) {
    const r = clientRects[i];
    if (r.width > 0 && r.height > 0) {
      rects.push({
        left: r.left - divRect.left,
        top: r.top - divRect.top,
        width: r.width,
        height: r.height
      });
    }
  }

  return {
    caret: {
      top: cRect.top - divRect.top,
      left: cRect.left - divRect.left,
      height: cRect.height || defaultLineHeight
    },
    rects
  };
}

export function getCaretCoordinates(element, rawPosition) {
  const result = getSelectionCoordinates(element, rawPosition, rawPosition, rawPosition);
  return result.caret;
}
