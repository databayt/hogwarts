"use client";

import { useCurrentUser } from '@/components/auth/use-current-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfileViewPage() {
  const user = useCurrentUser();

  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className='flex w-full flex-col p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account details</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Name</div>
            <div className='text-base font-medium'>{user?.name ?? '—'}</div>
            <div className='text-sm text-muted-foreground mt-3'>Email</div>
            <div className='text-base font-medium'>{user?.email ?? '—'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
