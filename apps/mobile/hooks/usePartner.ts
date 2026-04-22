import { useEffect } from 'react';
import { usePartnerStore } from '@stores/partnerStore';
import { useAuthStore } from '@stores/authStore';

export function usePartner() {
  const partnership = usePartnerStore((s) => s.partnership);
  const partnerProfile = usePartnerStore((s) => s.partnerProfile);
  const isLoading = usePartnerStore((s) => s.isLoading);
  const error = usePartnerStore((s) => s.error);
  const fetchPartnership = usePartnerStore((s) => s.fetchPartnership);
  const linkPartner = usePartnerStore((s) => s.linkPartner);
  const sendNudge = usePartnerStore((s) => s.sendNudge);
  const pendingInviteCode = usePartnerStore((s) => s.pendingInviteCode);
  const setPendingInviteCode = usePartnerStore((s) => s.setPendingInviteCode);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.id) {
      fetchPartnership();
    }
  }, [user?.id, fetchPartnership]);

  return {
    partnership,
    partnerProfile,
    isLoading,
    error,
    fetchPartnership,
    linkPartner,
    sendNudge,
    pendingInviteCode,
    setPendingInviteCode,
  };
}
