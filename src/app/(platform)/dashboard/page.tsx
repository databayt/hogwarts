// import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  redirect('/overview');
}
