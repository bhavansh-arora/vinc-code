import Shell from '@/components/Shell';
import { requireRole } from '@/lib/auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('admin');
  return <Shell user={user}>{children}</Shell>;
}
