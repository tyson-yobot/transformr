import { useState, useEffect, useCallback } from 'react';
import {
  requestLocationPermissions,
  startGeofencing,
  stopGeofencing,
  fetchUserGeofences,
  convertToGeofenceRegions,
} from '@services/geofence';
import { useAuthStore } from '@stores/authStore';

interface GeofenceTrigger {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  trigger_on: string;
  action: string;
  action_params: Record<string, unknown> | null;
  is_active: boolean;
}

export function useGeofence() {
  const [enabled, setEnabled] = useState(false);
  const [triggers, setTriggers] = useState<GeofenceTrigger[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchUserGeofences(user.id).then((data) => {
        const geofences = (data ?? []) as GeofenceTrigger[];
        setTriggers(geofences);

        if (geofences.length > 0) {
          enableGeofencing(geofences);
        }
      });
    }

    return () => {
      stopGeofencing().catch(() => {});
    };
  }, [user?.id]);

  const enableGeofencing = useCallback(async (geofences: GeofenceTrigger[]) => {
    const granted = await requestLocationPermissions();
    setHasPermission(granted);

    if (granted && geofences.length > 0) {
      const regions = convertToGeofenceRegions(geofences);
      await startGeofencing(regions);
      setEnabled(true);
    }
  }, []);

  const disableGeofencing = useCallback(async () => {
    await stopGeofencing();
    setEnabled(false);
  }, []);

  return {
    enabled,
    triggers,
    hasPermission,
    enableGeofencing: () => enableGeofencing(triggers),
    disableGeofencing,
  };
}
