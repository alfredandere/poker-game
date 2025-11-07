import toast from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'loading';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
    });
  },
  
  error: (message: string) => {
    toast.error(message, {
      duration: 6000,
      position: 'top-right',
    });
  },
  
  info: (message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
    });
  },
  
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  },
  
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
  
  update: (toastId: string, options: Parameters<typeof toast.loading>[1] & { message: string }) => {
    toast.dismiss(toastId);
    toast.success(options.message, {
      duration: 4000,
      position: 'top-right',
    });
  }
};