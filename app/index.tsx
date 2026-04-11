import { Redirect } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';

export default function Index() {
  const token = useAuthStore((s) => s.token);
  return <Redirect href={token ? '/(app)/home' : '/(auth)/login'} />;
}
