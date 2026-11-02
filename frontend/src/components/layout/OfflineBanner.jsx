import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Thông báo trạng thái ngoại tuyến"
      className="bg-zinc-800 text-zinc-200 border-b border-zinc-700 px-4 py-1.5 text-xs shrink-0"
    >
      <div className="w-full px-2 sm:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Bạn đang ngoại tuyến: Mọi ghi chú vẫn được lưu an toàn trên thiết bị và sẽ tự động đồng bộ khi có kết nối trở lại.
          </span>
        </div>
      </div>
    </aside>
  );
}
