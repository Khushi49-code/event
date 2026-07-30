// store/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // App State
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  // Notification State
  notifications: any[];
  addNotification: (notification: any) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;

  // Loading State
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Filter State
  filters: {
    search: string;
    status: string;
    type: string;
  };
  setFilters: (filters: Partial<AppState['filters']>) => void;
  resetFilters: () => void;
}

const useStore = create<AppState>()(
  persist(
    (set) => ({
      // UI State
      sidebarCollapsed: false,
      theme: 'light',
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),

      // App State
      selectedEventId: null,
      setSelectedEventId: (id) => set({ selectedEventId: id }),

      // Notification State
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications]
      })),
      clearNotifications: () => set({ notifications: [] }),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      })),

      // Loading State
      loading: false,
      setLoading: (loading) => set({ loading }),

      // Filter State
      filters: {
        search: '',
        status: 'all',
        type: 'all',
      },
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      resetFilters: () => set({
        filters: { search: '', status: 'all', type: 'all' }
      }),
    }),
    {
      name: 'event-management-storage',
    }
  )
);

export default useStore;