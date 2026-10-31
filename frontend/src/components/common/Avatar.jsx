import React from 'react';

export function Avatar({ src, name = 'User', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg font-semibold',
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border border-zinc-200 dark:border-zinc-700 ${className}`}
      />
    );
  }

  // Avatar mặc định phù hợp khi user chưa upload (Tiêu chí 5)
  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full flex items-center justify-center font-medium select-none bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
