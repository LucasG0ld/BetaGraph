import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'error';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    /** Ajoute un toast et retourne son ID */
    addToast: (message: string, type?: ToastType, duration?: number) => string;
    /** Supprime un toast par son ID */
    removeToast: (id: string) => void;
    /** Met à jour un toast existant (ex: loading -> success) */
    updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],

    addToast: (message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, message, type, duration };

        set((state) => ({ toasts: [...state.toasts, newToast] }));

        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }

        return id;
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),

    updateToast: (id, updates) =>
        set((state) => ({
            toasts: state.toasts.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            ),
        })),
}));
