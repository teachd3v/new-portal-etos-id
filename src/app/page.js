import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJwt, getDashboardPathByRole } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const payload = token ? await verifyJwt(token) : null;

  if (payload?.role) {
    redirect(getDashboardPathByRole(payload.role));
  }

  redirect('/login');
}
