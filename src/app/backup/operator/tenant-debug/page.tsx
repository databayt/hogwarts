import { db } from "@/lib/db";
import { getTenantContext } from "@/components/platform/operator/lib/tenant";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TenantDebugPage() {
	const { schoolId } = await getTenantContext();

	const schools = await db.school.findMany({
		select: { id: true, name: true, domain: true },
		orderBy: { name: "asc" },
	});

	if (!schoolId) {
		return (
			<div className="mx-auto max-w-3xl p-6 space-y-6">
				<h1 className="text-2xl font-semibold">Tenant Debug</h1>
				<p className="text-sm text-muted-foreground">
					No active tenant detected. Select a school below to simulate a tenant in development
					using <code>?x-school=&lt;domain&gt;</code>, or visit a subdomain in production.
				</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{schools.map((s) => (
						<Link
							key={s.id}
							href={`?x-school=${encodeURIComponent(s.domain)}`}
							className="rounded-md border p-3 hover:bg-accent"
						>
							<div className="font-medium">{s.name}</div>
							<div className="text-xs text-muted-foreground">domain: {s.domain}</div>
						</Link>
					))}
				</div>
			</div>
		);
	}

	const school = await db.school.findUnique({ where: { id: schoolId }, select: { name: true, domain: true } });

	const [studentCount, teacherCount, classCount] = await Promise.all([
		db.student.count({ where: { schoolId } }),
		db.teacher.count({ where: { schoolId } }),
		// Some installs may not have Class seeded; count 0 if missing
		(db as any).class?.count ? (db as any).class.count({ where: { schoolId } }) : Promise.resolve(0),
	]);

	return (
		<div className="mx-auto max-w-3xl p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Tenant Debug</h1>
			<div className="rounded-md border p-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm text-muted-foreground">Current school</div>
						<div className="text-lg font-medium">{school?.name ?? "Unknown"}</div>
						<div className="text-xs text-muted-foreground">domain: {school?.domain ?? "?"}</div>
					</div>
					<div className="text-right">
						<div className="text-sm">students: <span className="font-semibold">{studentCount}</span></div>
						<div className="text-sm">teachers: <span className="font-semibold">{teacherCount}</span></div>
						<div className="text-sm">classes: <span className="font-semibold">{classCount}</span></div>
					</div>
				</div>
			</div>
			<div>
				<h2 className="text-base font-semibold mb-2">Switch tenant</h2>
				<p className="text-sm text-muted-foreground mb-3">
					Click a school to reload this page with <code>?x-school=&lt;domain&gt;</code> (dev) or visit its
					subdomain in production. You should see counts change instantly.
				</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{schools.map((s) => (
						<Link
							key={s.id}
							href={`?x-school=${encodeURIComponent(s.domain)}`}
							className="rounded-md border p-3 hover:bg-accent"
						>
							<div className="font-medium">{s.name}</div>
							<div className="text-xs text-muted-foreground">domain: {s.domain}</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}


