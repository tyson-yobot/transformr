import { useEffect } from 'react';
import { useProfileStore } from '@stores/profileStore';
import { useAuthStore } from '@stores/authStore';

export function useProfile() {
  const profile = useProfileStore((s) => s.profile);
  const isLoading = useProfileStore((s) => s.isLoading);
  const error = useProfileStore((s) => s.error);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, fetchProfile]);

  return { profile, isLoading, error, updateProfile };
}
