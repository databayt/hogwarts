/**
 * CSV Import Service - Domain-specific bulk import
 *
 * This file handles domain-specific student/teacher bulk import with database operations.
 * For generic client-side file import with UI wizard, use the Importer component.
 *
 * @example
 * ```tsx
 * // For UI-based file import with preview and mapping:
 * import { Importer, useImport } from "@/components/file"
 *
 * // For bulk database import:
 * import { importStudents, importTeachers } from "@/components/file"
 * ```
 */

import { parse } from 'csv-parse/sync';
import { z, ZodError } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import {
  formatZodError,
  validateDateFormat,
  validatePhoneFormat,
  validateGuardianInfo,
  formatDuplicateError,
  createRowErrorMessage,
} from './csv-validation';

// Validation schemas for CSV data
const studentCsvSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  studentId: z.string().min(1, 'Student ID is required'),
  yearLevel: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

const teacherCsvSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  subjects: z.string().optional(), // Comma-separated list
  qualification: z.string().optional(),
});

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
    details?: string; // Enhanced error details with suggestions
  }>;
  warnings?: Array<{
    row: number;
    warning: string;
  }>;
}

class CsvImportService {
  /**
   * Parse CSV content
   */
  private parseCSV(content: string): any[] {
    try {
      return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: (value) => {
          // Convert empty strings to undefined
          return value === '' ? undefined : value;
        },
      });
    } catch (error) {
      logger.error('CSV parsing failed', error instanceof Error ? error : new Error('Unknown error'), {
        action: 'csv_parse_error',
      });
      throw new Error('Failed to parse CSV file');
    }
  }

  /**
   * Import students from CSV
   */
  async importStudents(csvContent: string, schoolId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    try {
      const rows = this.parseCSV(csvContent);

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2; // Account for header row
        try {
          // Validate with Zod schema
          const validated = studentCsvSchema.parse(rows[i]);

          // Additional field-level validations
          const validationErrors = [];

          // Validate date of birth format
          if (validated.dateOfBirth) {
            const dateValidation = validateDateFormat(validated.dateOfBirth, 'dateOfBirth');
            if (!dateValidation.isValid) {
              validationErrors.push(...dateValidation.errors);
            }
          }

          // Validate guardian phone format
          if (validated.guardianPhone) {
            const phoneValidation = validatePhoneFormat(validated.guardianPhone, 'guardianPhone');
            if (!phoneValidation.isValid) {
              validationErrors.push(...phoneValidation.errors);
            }
          }

          // Validate guardian information completeness
          const guardianValidation = validateGuardianInfo({
            guardianName: validated.guardianName,
            guardianEmail: validated.guardianEmail,
            guardianPhone: validated.guardianPhone,
          });
          if (!guardianValidation.isValid) {
            validationErrors.push(...guardianValidation.errors);
          }

          // If there are validation errors, add them to result
          if (validationErrors.length > 0) {
            result.errors.push({
              row: rowNumber,
              error: 'Validation failed',
              details: createRowErrorMessage(rowNumber, validationErrors),
              data: rows[i],
            });
            result.failed++;
            continue;
          }

          // Check if student already exists
          const existingStudent = await db.student.findFirst({
            where: {
              schoolId,
              studentId: validated.studentId,
            },
          });

          if (existingStudent) {
            result.errors.push({
              row: rowNumber,
              error: formatDuplicateError('studentId', validated.studentId, 'student'),
              details: `This student ID is already registered in the system. Please use a unique student ID.`,
              data: validated,
            });
            result.failed++;
            continue;
          }

          // Create user account for student
          const defaultPassword = await hash(`student${validated.studentId}`, 10);
          const user = await db.user.create({
            data: {
              username: validated.name,
              email: validated.email || `${validated.studentId}@school.local`,
              password: defaultPassword,
              role: 'STUDENT',
              schoolId,
            },
          });

          // Parse name into first and last name
          const nameParts = validated.name.trim().split(/\s+/);
          const givenName = nameParts[0] || 'Unknown';
          const surname = nameParts.slice(1).join(' ') || 'Unknown';

          // Create student record
          const student = await db.student.create({
            data: {
              userId: user.id,
              schoolId,
              studentId: validated.studentId,
              givenName,
              surname,
              dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : new Date('2010-01-01'), // Default date
              gender: validated.gender || 'other',
            },
          });

          // Create guardian if provided
          if (validated.guardianName && validated.guardianEmail) {
            // Check if guardian already exists
            let guardian = await db.guardian.findFirst({
              where: {
                schoolId,
                user: {
                  email: validated.guardianEmail,
                },
              },
            });

            if (!guardian) {
              // Create guardian user
              const guardianPassword = await hash('parent123', 10);
              const guardianUser = await db.user.create({
                data: {
                  username: validated.guardianName,
                  email: validated.guardianEmail,
                  password: guardianPassword,
                  role: 'GUARDIAN',
                  schoolId,
                },
              });

              // Parse guardian name into first and last name
              const guardianNameParts = validated.guardianName.trim().split(/\s+/);
              const guardianGivenName = guardianNameParts[0] || 'Unknown';
              const guardianSurname = guardianNameParts.slice(1).join(' ') || 'Unknown';

              // Create guardian record
              guardian = await db.guardian.create({
                data: {
                  userId: guardianUser.id,
                  schoolId,
                  givenName: guardianGivenName,
                  surname: guardianSurname,
                  emailAddress: validated.guardianEmail,
                },
              });

              // Add phone number if provided
              if (validated.guardianPhone) {
                await db.guardianPhoneNumber.create({
                  data: {
                    guardianId: guardian.id,
                    schoolId,
                    phoneNumber: validated.guardianPhone,
                    isPrimary: true,
                  },
                });
              }
            }

            // Get or create a default guardian type
            let guardianType = await db.guardianType.findFirst({
              where: {
                schoolId,
                name: 'guardian',
              },
            });

            if (!guardianType) {
              guardianType = await db.guardianType.create({
                data: {
                  schoolId,
                  name: 'guardian',
                },
              });
            }

            // Link guardian to student
            await db.studentGuardian.create({
              data: {
                studentId: student.id,
                guardianId: guardian.id,
                schoolId,
                guardianTypeId: guardianType.id,
                isPrimary: true,
              },
            });
          }

          result.imported++;
          
          logger.info('Student imported successfully', {
            action: 'student_import',
            schoolId,
            studentId: validated.studentId,
            row: rowNumber,
          });
        } catch (error) {
          // Enhanced error handling with Zod errors
          if (error instanceof ZodError) {
            const formattedError = formatZodError(error);
            result.errors.push({
              row: rowNumber,
              error: 'Schema validation failed',
              details: formattedError.formattedMessage,
              data: rows[i],
            });
          } else {
            result.errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : 'Unknown error',
              details: error instanceof Error ? error.stack : undefined,
              data: rows[i],
            });
          }
          result.failed++;
        }
      }

      result.success = result.imported > 0;
      return result;
    } catch (error) {
      logger.error('Student import failed', error instanceof Error ? error : new Error('Unknown error'), {
        action: 'student_import_error',
        schoolId,
      });
      throw error;
    }
  }

  /**
   * Import teachers from CSV
   */
  async importTeachers(csvContent: string, schoolId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    try {
      const rows = this.parseCSV(csvContent);

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2;
        try {
          // Validate with Zod schema
          const validated = teacherCsvSchema.parse(rows[i]);

          // Additional field-level validations
          const validationErrors = [];

          // Validate phone number format
          if (validated.phoneNumber) {
            const phoneValidation = validatePhoneFormat(validated.phoneNumber, 'phoneNumber');
            if (!phoneValidation.isValid) {
              validationErrors.push(...phoneValidation.errors);
            }
          }

          // If there are validation errors, add them to result
          if (validationErrors.length > 0) {
            result.errors.push({
              row: rowNumber,
              error: 'Validation failed',
              details: createRowErrorMessage(rowNumber, validationErrors),
              data: rows[i],
            });
            result.failed++;
            continue;
          }

          // Check if teacher already exists
          const existingTeacher = await db.teacher.findFirst({
            where: {
              schoolId,
              employeeId: validated.employeeId,
            },
          });

          if (existingTeacher) {
            result.errors.push({
              row: rowNumber,
              error: formatDuplicateError('employeeId', validated.employeeId, 'teacher'),
              details: `This employee ID is already registered in the system. Please use a unique employee ID.`,
              data: validated,
            });
            result.failed++;
            continue;
          }

          // Check if email already exists
          const existingUser = await db.user.findFirst({
            where: {
              email: validated.email,
              schoolId,
            },
          });

          if (existingUser) {
            result.errors.push({
              row: rowNumber,
              error: formatDuplicateError('email', validated.email, 'user'),
              details: `This email address is already registered in the system. Each teacher must have a unique email address.`,
              data: validated,
            });
            result.failed++;
            continue;
          }

          // Create user account for teacher
          const defaultPassword = await hash(`teacher${validated.employeeId}`, 10);
          const user = await db.user.create({
            data: {
              username: validated.name,
              email: validated.email,
              password: defaultPassword,
              role: 'TEACHER',
              schoolId,
            },
          });

          // Parse name into first and last name
          const teacherNameParts = validated.name.trim().split(/\s+/);
          const teacherGivenName = teacherNameParts[0] || 'Unknown';
          const teacherSurname = teacherNameParts.slice(1).join(' ') || 'Unknown';

          // Create teacher record
          const teacher = await db.teacher.create({
            data: {
              userId: user.id,
              schoolId,
              employeeId: validated.employeeId,
              givenName: teacherGivenName,
              surname: teacherSurname,
              emailAddress: validated.email,
            },
          });

          // Add phone number if provided
          if (validated.phoneNumber) {
            await db.teacherPhoneNumber.create({
              data: {
                teacherId: teacher.id,
                schoolId,
                phoneNumber: validated.phoneNumber,
                isPrimary: true,
              },
            });
          }

          // Link to department if provided
          if (validated.department) {
            const department = await db.department.findFirst({
              where: {
                schoolId,
                departmentName: validated.department,
              },
            });

            if (department) {
              await db.teacherDepartment.create({
                data: {
                  teacherId: teacher.id,
                  departmentId: department.id,
                  schoolId,
                },
              });
            }
          }

          result.imported++;
          
          logger.info('Teacher imported successfully', {
            action: 'teacher_import',
            schoolId,
            employeeId: validated.employeeId,
            row: rowNumber,
          });
        } catch (error) {
          // Enhanced error handling with Zod errors
          if (error instanceof ZodError) {
            const formattedError = formatZodError(error);
            result.errors.push({
              row: rowNumber,
              error: 'Schema validation failed',
              details: formattedError.formattedMessage,
              data: rows[i],
            });
          } else {
            result.errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : 'Unknown error',
              details: error instanceof Error ? error.stack : undefined,
              data: rows[i],
            });
          }
          result.failed++;
        }
      }

      result.success = result.imported > 0;
      return result;
    } catch (error) {
      logger.error('Teacher import failed', error instanceof Error ? error : new Error('Unknown error'), {
        action: 'teacher_import_error',
        schoolId,
      });
      throw error;
    }
  }

  /**
   * Generate sample CSV template
   */
  generateStudentTemplate(): string {
    const headers = ['name', 'email', 'studentId', 'yearLevel', 'guardianName', 'guardianEmail', 'guardianPhone', 'dateOfBirth', 'gender'];
    const sample = [
      headers.join(','),
      'John Doe,john.doe@example.com,STD001,Grade 10,Jane Doe,jane.doe@example.com,+1234567890,2008-05-15,male',
      'Sarah Smith,,STD002,Grade 9,Mike Smith,mike.smith@example.com,+0987654321,2009-03-22,female',
    ];
    return sample.join('\n');
  }

  generateTeacherTemplate(): string {
    const headers = ['name', 'email', 'employeeId', 'department', 'phoneNumber', 'subjects', 'qualification'];
    const sample = [
      headers.join(','),
      'Dr. Alice Johnson,alice.johnson@school.edu,TCH001,Mathematics,+1234567890,"Algebra,Calculus",PhD in Mathematics',
      'Mr. Bob Wilson,bob.wilson@school.edu,TCH002,Science,+0987654321,Physics,MSc in Physics',
    ];
    return sample.join('\n');
  }
}

// Export singleton instance
export const csvImportService = new CsvImportService();

// Export convenience functions
export const importStudents = (csvContent: string, schoolId: string) => csvImportService.importStudents(csvContent, schoolId);
export const importTeachers = (csvContent: string, schoolId: string) => csvImportService.importTeachers(csvContent, schoolId);
export const generateStudentTemplate = () => csvImportService.generateStudentTemplate();
export const generateTeacherTemplate = () => csvImportService.generateTeacherTemplate();