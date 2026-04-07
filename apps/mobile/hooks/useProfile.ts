import { useEffect } from 'react';
import { useProfileStore } from '@stores/profileStore';
import { useAuthStore } from '@stores/authStore';

export function useProfile() {
  const { profile, isLoading, error, fetchProfile, updateProfile } = useProfileStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, fetchProfile]);

  return { profile, isLoading, error, updateProfile };
}
