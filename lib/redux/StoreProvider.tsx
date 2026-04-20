'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { useEffect } from 'react';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { syncAuthState } from './slices/authSlice';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(syncAuthState());
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isAuthenticated') {
        store.dispatch(syncAuthState());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return <Provider store={store}>{children}<ToastContainer
    position="top-right"
    autoClose={4000}
    hideProgressBar={false}
    newestOnTop
    closeOnClick
    pauseOnHover
    draggable
    theme="dark"
  />
  </Provider>;
}
