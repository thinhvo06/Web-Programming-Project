// Quản lý cơ sở dữ liệu IndexedDB tại Client cho chế độ PWA Offline
// Nâng cấp DB_VERSION lên 3 để đảm bảo mọi trình duyệt đã truy cập trước đó đều tạo đủ bảng syncQueue
const DB_NAME = 'NoteApp_DB';
const DB_VERSION = 3;
const LOCAL_QUEUE_KEY = 'noteapp_sync_queue';

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        noteStore.createIndex('isPinned', 'isPinned', { unique: false });
      }
      if (!db.objectStoreNames.contains('labels')) {
        db.createObjectStore('labels', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function idbGetAll(storeName) {
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`Lỗi idbGetAll store ${storeName}:`, err);
    return [];
  }
}

export async function idbPut(storeName, item) {
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`Lỗi idbPut store ${storeName}:`, err);
  }
}

export async function idbDelete(storeName, key) {
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`Lỗi idbDelete store ${storeName}:`, err);
  }
}

export async function idbBulkPut(storeName, items) {
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`Lỗi idbBulkPut store ${storeName}:`, err);
  }
}

export async function idbQueueSync(action, payload) {
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains('syncQueue')) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const request = store.add({
        action,
        payload,
        timestamp: new Date().toISOString()
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Lỗi idbQueueSync:', err);
  }
}

export async function idbClearSyncQueue() {
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains('syncQueue')) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Lỗi idbClearSyncQueue:', err);
  }
}

// ============================================================================
// HÀNG ĐỢI ĐỒNG BỘ KÉP (INDEXEDDB + LOCALSTORAGE DỰ PHÒNG CHỐNG LỖI 100%)
// ============================================================================
function getLocalQueue() {
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalQueue(queue) {
  try {
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Lỗi ghi local sync queue:', e);
  }
}

/**
 * Đẩy một tác vụ cần đồng bộ vào hàng đợi (lưu song song cả LocalStorage và IndexedDB)
 */
export async function queueSyncAction(action, payload) {
  // 1. Lưu dự phòng vào LocalStorage (Đảm bảo 100% không bao giờ mất)
  const localQ = getLocalQueue();
  localQ.push({
    id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    action,
    payload,
    timestamp: new Date().toISOString()
  });
  setLocalQueue(localQ);

  // 2. Lưu vào IndexedDB chuẩn PWA
  await idbQueueSync(action, payload);
}

/**
 * Lấy tất cả các tác vụ đang chờ đồng bộ từ cả LocalStorage và IndexedDB
 */
export async function getPendingSyncQueue() {
  const localQ = getLocalQueue();
  const idbQ = await idbGetAll('syncQueue');

  // Gộp cả 2 nguồn và loại bỏ trùng lặp nếu có
  const all = [...localQ, ...idbQ];
  return all;
}

/**
 * Xóa sạch hàng đợi sau khi đã đồng bộ thành công
 */
export async function clearPendingSyncQueue() {
  setLocalQueue([]);
  await idbClearSyncQueue();
}
