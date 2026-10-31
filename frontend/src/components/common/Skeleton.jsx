import React from 'react';

export function NoteSkeleton({ viewMode = 'grid' }) {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 animate-pulse"
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-2/3"></div>
            </div>
            <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded ml-4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="p-5 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 animate-pulse"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5"></div>
            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-full"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-4/5"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-2/3"></div>
          </div>
          <div className="flex gap-2 pt-3">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-14"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
