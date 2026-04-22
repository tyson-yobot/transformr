import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@stores/dashboardStore';
import { useAuthStore } from '@stores/authStore';

export function useDashboardLayout() {
  const layout = useDashboardStore((s) => s.layout);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const fetchLayout = useDashboardStore((s) => s.fetchLayout);
  const storeResetToDefault = useDashboardStore((s) => s.resetToDefault);
  const saveLayout = useDashboardStore((s) => s.saveLayout);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.id) {
      fetchLayout();
    }
  }, [user?.id, fetchLayout]);

  const resetToDefault = useCallback(async () => {
    await storeResetToDefault();
  }, [storeResetToDefault]);

  const addWidget = useCallback(async (widgetType: string) => {
    const currentLayout = useDashboardStore.getState().layout;
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
    await saveLayout([...currentLayout, newWidget]);
  }, [saveLayout]);

  const removeWidget = useCallback(async (index: number) => {
    const currentLayout = useDashboardStore.getState().layout;
    const updated = currentLayout.filter((_, i) => i !== index);
    await saveLayout(updated);
  }, [saveLayout]);

  const reorderWidgets = useCallback(async (fromIndex: number, toIndex: number) => {
    const currentLayout = [...useDashboardStore.getState().layout];
    const [moved] = currentLayout.splice(fromIndex, 1);
    if (moved) {
      currentLayout.splice(toIndex, 0, moved);
      currentLayout.forEach((widget, i) => {
        widget.position = i;
      });
      await saveLayout(currentLayout);
    }
  }, [saveLayout]);

  return {
    layout,
    isLoading,
    resetToDefault,
    addWidget,
    removeWidget,
    reorderWidgets,
  };
}
