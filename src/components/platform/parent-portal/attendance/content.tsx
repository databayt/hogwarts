import { auth } from '@/auth';
import { db } from '@/lib/db';
import { AttendanceView } from './view';
import { redirect } from 'next/navigation';

export async function ParentAttendanceContent() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is a parent/guardian
  const guardian = await db.guardian.findFirst({
    where: {
      userId: session.user.id,
      schoolId: session.user.schoolId!,
    },
    include: {
      studentGuardians: {
        include: {
          student: {
            include: {
              user: true,
              studentClasses: {
                include: {
                  class: {
                    include: {
                      subject: true,
                      teacher: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
              attendances: {
                orderBy: {
                  date: 'desc',
                },
                take: 90, // Last 90 days
                include: {
                  class: {
                    include: {
                      subject: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!guardian) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have access to parent portal.</p>
      </div>
    );
  }

  // Prepare data for the view
  const students = guardian.studentGuardians.map(sg => ({
    id: sg.student.id,
    name: sg.student.user.name || 'Student',
    email: sg.student.user.email,
    classes: sg.student.studentClasses.map(sc => ({
      id: sc.class.id,
      name: `${sc.class.subject.subjectName} - ${sc.class.name}`,
      teacher: sc.class.teacher?.user.name || 'N/A',
    })),
    attendances: sg.student.attendances.map(a => ({
      id: a.id,
      date: a.date,
      status: a.status,
      classId: a.classId,
      className: a.class.subject.subjectName,
      notes: a.notes,
    })),
  }));

  return <AttendanceView students={students} />;
}