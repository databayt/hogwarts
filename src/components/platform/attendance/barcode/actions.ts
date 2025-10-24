"use server";

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { barcodeScanSchema, studentIdentifierSchema } from '../shared/validation';

/**
 * Process barcode scan for attendance
 */
export async function processBarcodeScan(data: z.infer<typeof barcodeScanSchema>) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const { barcode, format, scannedAt, deviceId } = data;
    const schoolId = session.user.schoolId;

    // Find student by barcode
    const studentIdentifier = await db.studentIdentifier.findFirst({
      where: {
        schoolId,
        type: 'BARCODE',
        value: barcode,
        isActive: true
      },
      include: {
        student: true
      }
    });

    if (!studentIdentifier) {
      // Log failed scan
      await db.attendanceEvent.create({
        data: {
          schoolId,
          studentId: session.user.id, // Scanner user
          eventType: 'SCAN_FAILURE',
          method: 'BARCODE',
          deviceId,
          success: false,
          errorMessage: 'Barcode not found in system',
          metadata: { barcode, format },
          timestamp: new Date(scannedAt)
        }
      });

      throw new Error('Barcode not found in system');
    }

    // Check if expired
    if (studentIdentifier.expiresAt && new Date(studentIdentifier.expiresAt) < new Date()) {
      throw new Error('Card has expired');
    }

    // Get current class (would need to determine this based on schedule/context)
    // For now, we'll require classId to be passed
    const classId = 'current-class-id'; // This should be determined from context

    // Check if attendance already marked
    const existingAttendance = await db.attendance.findFirst({
      where: {
        schoolId,
        studentId: studentIdentifier.studentId,
        classId,
        date: new Date(new Date().toDateString()) // Today's date without time
      }
    });

    if (existingAttendance) {
      throw new Error('Attendance already marked for this student today');
    }

    // Mark attendance
    const attendance = await db.attendance.create({
      data: {
        schoolId,
        studentId: studentIdentifier.studentId,
        classId,
        date: new Date(),
        status: 'PRESENT',
        method: 'BARCODE',
        deviceId: barcode,
        checkInTime: new Date(scannedAt),
        confidence: 1.0,
        markedAt: new Date()
      }
    });

    // Update identifier usage
    await db.studentIdentifier.update({
      where: { id: studentIdentifier.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 }
      }
    });

    // Log successful scan
    await db.attendanceEvent.create({
      data: {
        schoolId,
        studentId: studentIdentifier.studentId,
        eventType: 'SCAN_SUCCESS',
        method: 'BARCODE',
        deviceId,
        success: true,
        metadata: {
          barcode,
          format,
          attendanceId: attendance.id
        },
        timestamp: new Date(scannedAt)
      }
    });

    revalidatePath('/attendance/barcode');

    return {
      success: true,
      data: {
        attendanceId: attendance.id,
        studentName: studentIdentifier.student.firstName + ' ' + studentIdentifier.student.lastName,
        status: attendance.status
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process barcode scan'
    };
  }
}

/**
 * Assign barcode to student
 */
export async function assignBarcodeToStudent(data: z.infer<typeof studentIdentifierSchema>) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      throw new Error('Insufficient permissions');
    }

    const schoolId = session.user.schoolId;

    // Check if barcode already exists
    const existing = await db.studentIdentifier.findFirst({
      where: {
        schoolId,
        type: 'BARCODE',
        value: data.value
      }
    });

    if (existing) {
      throw new Error('Barcode already assigned to another student');
    }

    // Check if student exists
    const student = await db.student.findFirst({
      where: {
        id: data.studentId,
        schoolId
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Create identifier
    const identifier = await db.studentIdentifier.create({
      data: {
        schoolId,
        studentId: data.studentId,
        type: 'BARCODE',
        value: data.value,
        isActive: data.isActive ?? true,
        issuedBy: session.user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
      },
      include: {
        student: true
      }
    });

    revalidatePath('/attendance/barcode');

    return {
      success: true,
      data: identifier
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign barcode'
    };
  }
}

/**
 * Get student barcodes
 */
export async function getStudentBarcodes(studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const schoolId = session.user.schoolId;

    const barcodes = await db.studentIdentifier.findMany({
      where: {
        schoolId,
        type: 'BARCODE',
        ...(studentId && { studentId })
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: barcodes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch barcodes'
    };
  }
}

/**
 * Update barcode status
 */
export async function updateBarcodeStatus(
  identifierId: string,
  isActive: boolean
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      throw new Error('Insufficient permissions');
    }

    const schoolId = session.user.schoolId;

    const identifier = await db.studentIdentifier.findFirst({
      where: {
        id: identifierId,
        schoolId,
        type: 'BARCODE'
      }
    });

    if (!identifier) {
      throw new Error('Barcode not found');
    }

    await db.studentIdentifier.update({
      where: { id: identifierId },
      data: { isActive }
    });

    revalidatePath('/attendance/barcode');

    return {
      success: true,
      message: `Barcode ${isActive ? 'activated' : 'deactivated'} successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update barcode status'
    };
  }
}

/**
 * Delete barcode
 */
export async function deleteBarcode(identifierId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check permissions
    if (session.user.role !== 'ADMIN') {
      throw new Error('Only administrators can delete barcodes');
    }

    const schoolId = session.user.schoolId;

    const identifier = await db.studentIdentifier.findFirst({
      where: {
        id: identifierId,
        schoolId,
        type: 'BARCODE'
      }
    });

    if (!identifier) {
      throw new Error('Barcode not found');
    }

    await db.studentIdentifier.delete({
      where: { id: identifierId }
    });

    revalidatePath('/attendance/barcode');

    return {
      success: true,
      message: 'Barcode deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete barcode'
    };
  }
}

/**
 * Bulk import barcodes from CSV
 */
export async function bulkImportBarcodes(csvData: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      throw new Error('Insufficient permissions');
    }

    const schoolId = session.user.schoolId;
    const rows = csvData.split('\n').slice(1); // Skip header
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const row of rows) {
      const [studentId, barcode, expiryDate] = row.split(',').map(s => s.trim());

      if (!studentId || !barcode) continue;

      try {
        // Check if student exists
        const student = await db.student.findFirst({
          where: { id: studentId, schoolId }
        });

        if (!student) {
          results.failed++;
          results.errors.push(`Student ${studentId} not found`);
          continue;
        }

        // Check if barcode already exists
        const existing = await db.studentIdentifier.findFirst({
          where: { schoolId, type: 'BARCODE', value: barcode }
        });

        if (existing) {
          results.failed++;
          results.errors.push(`Barcode ${barcode} already exists`);
          continue;
        }

        // Create identifier
        await db.studentIdentifier.create({
          data: {
            schoolId,
            studentId,
            type: 'BARCODE',
            value: barcode,
            isActive: true,
            issuedBy: session.user.id,
            expiresAt: expiryDate ? new Date(expiryDate) : undefined
          }
        });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import ${studentId}: ${error}`);
      }
    }

    revalidatePath('/attendance/barcode');

    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import barcodes'
    };
  }
}