import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, X } from 'lucide-react';

export function ActivationBanner() {
  const { user, activateAccount } = useAuth();
  const { showSuccess } = useToast();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  if (!user || user.isActivated || isDismissed) {
    return null;
  }

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await activateAccount();
      showSuccess('Kích hoạt tài khoản thành công!');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <aside
      aria-label="Thông báo kích hoạt tài khoản"
      className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Tài khoản chưa được kích hoạt qua email ({user.email}).
          </span>
          <button
            onClick={handleActivate}
            disabled={isActivating}
            className="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-800 ml-1 disabled:opacity-50"
          >
            {isActivating ? 'Đang kích hoạt...' : 'Bấm vào đây để kích hoạt ngay'}
          </button>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-300 p-0.5 rounded"
          title="Đóng tạm thời"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
