import { useEffect } from 'react';
import { usePartnerStore } from '@stores/partnerStore';
import { useAuthStore } from '@stores/authStore';

export function usePartner() {
  const store = usePartnerStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      store.fetchPartnership();
    }
  }, [user?.id]);

  return store;
}
