import { useEffect } from 'react';
import { usePartnerStore } from '@stores/partnerStore';
import { useAuthStore } from '@stores/authStore';

export function usePartner() {
  const store = usePartnerStore();
  const fetchPartnership = usePartnerStore((s) => s.fetchPartnership);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchPartnership();
    }
  }, [user?.id, fetchPartnership]);

  return store;
}
