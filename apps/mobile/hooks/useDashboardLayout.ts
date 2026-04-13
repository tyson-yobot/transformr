import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@stores/dashboardStore';
import { useAuthStore } from '@stores/authStore';

export function useDashboardLayout() {
  const store = useDashboardStore();
  const fetchLayout = useDashboardStore((s) => s.fetchLayout);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchLayout();
    }
  }, [user?.id, fetchLayout]);

  const resetToDefault = useCallback(async () => {
    await store.resetToDefault();
  }, [store]);

  const addWidget = useCallback(async (widgetType: string) => {
    const currentLayout = store.layout;
    const maxPosition = currentLayout.reduce(
      (max, w) => Math.max(max, w.position), 0,
    );
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: widgetType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      size: 'medium' as const,
      position: maxPosition + 1,
      visible: true,
      config: {} as Record<string, string | number | boolean>,
    };
    await store.saveLayout([...currentLayout, newWidget]);
  }, [store]);

  const removeWidget = useCallback(async (index: number) => {
    const currentLayout = store.layout;
    const updated = currentLayout.filter((_, i) => i !== index);
    await store.saveLayout(updated);
  }, [store]);

  const reorderWidgets = useCallback(async (fromIndex: number, toIndex: number) => {
    const currentLayout = [...store.layout];
    const [moved] = currentLayout.splice(fromIndex, 1);
    if (moved) {
      currentLayout.splice(toIndex, 0, moved);
      currentLayout.forEach((widget, i) => {
        widget.position = i;
      });
      await store.saveLayout(currentLayout);
    }
  }, [store]);

  return {
    layout: store.layout,
    isLoading: store.isLoading,
    resetToDefault,
    addWidget,
    removeWidget,
    reorderWidgets,
  };
}
