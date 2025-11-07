"use client";

import toast, { ToastBar, Toaster, Toast } from 'react-hot-toast';

export function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: '!bg-gray-800 !text-white !border !border-gray-600 !shadow-lg',
        success: {
          className: '!bg-green-600 !text-white',
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        error: {
          className: '!bg-red-600 !text-white',
          duration: 6000,
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        loading: {
          className: '!bg-blue-600 !text-white',
        },
      }}
    >
      {(t: Toast) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              <span className="ml-2">{message}</span>
              {t.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-4 text-gray-300 hover:text-white"
                >
                  ×
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}