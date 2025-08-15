'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Employee', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' }
  ]
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();
	const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);

	useEffect(() => {
		setDynamicTitle(null);
		// Resolve dynamic names for known resources (e.g., students/:id)
		try {
			const match = pathname.match(/^\/students\/([^\/\?]+)/);
			if (match) {
				const id = match[1];
				const qs = typeof window !== 'undefined' ? (window.location.search || '') : '';
				void fetch(`/api/students/${id}${qs}`)
					.then((res) => (res.ok ? res.json() : null))
					.then((data) => {
						if (data?.name) setDynamicTitle(data.name as string);
					})
					.catch(() => {});
			}
		} catch {}
	}, [pathname, dynamicTitle]);

	const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
		const items = segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
			const isIdSegment = index === segments.length - 1 && /^(?:[a-z0-9]{10,}|\w{6,})$/i.test(segment);
			return {
				title: isIdSegment && dynamicTitle ? dynamicTitle : segment.charAt(0).toUpperCase() + segment.slice(1),
				link: path
			};
		});
		return items;
	}, [pathname, dynamicTitle]);

	return breadcrumbs;
}
