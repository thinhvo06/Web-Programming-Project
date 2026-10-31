import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Thông báo trạng thái ngoại tuyến"
      className="bg-zinc-800 text-zinc-200 border-b border-zinc-700 px-4 py-1.5 text-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>
            Chế độ Ngoại tuyến: Các thay đổi sẽ được lưu trên máy qua IndexedDB và tự động đồng bộ khi có Internet.
          </span>
        </div>
      </div>
    </aside>
  );
}
