"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";
import { parseCsvData, parseExcelData } from "@/lib/import-parser";
import { importSchema } from './validation';
import type { ImportFormData } from './types';
import type { ImportResult } from '@/lib/import-parser';

export async function processDataImport(
  schoolId: string, 
  data: any
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    // Validate input data
    const validatedData = importSchema.parse(data);
    
    // Process import based on source type
    let result: ImportResult;
    
    // Handle both 'source' and 'dataSource' field names
    const importSource = (data as any).source || validatedData.dataSource;
    switch (importSource) {
      case 'csv':
        result = await processCsvImport(schoolId, validatedData);
        break;
      case 'excel':
        result = await processExcelImport(schoolId, validatedData);
        break;
      case 'manual':
        result = await processManualImport(schoolId, validatedData);
        break;
      default:
        throw new Error('Unsupported import type');
    }
    
    // Update school with import status
    await db.school.update({
      where: { id: schoolId },
      data: {
        // Add import completion flag if needed
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}`);
    return createActionResponse(result);
  } catch (error) {
    logger.error("Failed to process data import", error as Error, { schoolId });
    return createActionResponse(undefined, error);
  }
}

async function processCsvImport(
  schoolId: string, 
  data: any
): Promise<ImportResult> {
  try {
    // Check if file content is provided
    if (!data.file) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          column: '',
          value: '',
          message: 'No file provided for CSV import'
        }],
        message: 'Please select a CSV file to import',
      };
    }

    // Parse the CSV content based on data types
    const dataType = data.dataTypes?.[0] || 'students';
    const fileContent = typeof data.file === 'string' ? data.file : await data.file.text();
    const result = await parseCsvData(fileContent, dataType as any);

    // If parsing was successful and we have data, save to database
    if (result.success && result.data) {
      // TODO: Save parsed data to database based on dataType
      logger.info('CSV import parsed successfully', {
        schoolId,
        dataType,
        imported: result.imported,
        skipped: result.skipped
      });
    }

    return result;
  } catch (error) {
    logger.error('CSV import failed', error as Error, { schoolId });
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [{
        row: 0,
        column: '',
        value: '',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      message: 'Failed to process CSV file',
    };
  }
}

async function processExcelImport(
  schoolId: string, 
  data: any
): Promise<ImportResult> {
  try {
    // Check if file content is provided
    if (!data.file) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          column: '',
          value: '',
          message: 'No file provided for Excel import'
        }],
        message: 'Please select an Excel file to import',
      };
    }

    // Convert file to ArrayBuffer if needed
    const dataType = data.dataTypes?.[0] || 'students';
    let buffer: ArrayBuffer;
    if (typeof data.file === 'string') {
      buffer = new TextEncoder().encode(data.file).buffer;
    } else {
      const tempBuffer = await data.file.arrayBuffer();
      buffer = tempBuffer instanceof ArrayBuffer ? tempBuffer : tempBuffer as ArrayBuffer;
    }
    
    const result = await parseExcelData(buffer, dataType as any);

    // If parsing was successful and we have data, save to database
    if (result.success && result.data) {
      // TODO: Save parsed data to database based on dataType
      logger.info('Excel import parsed successfully', {
        schoolId,
        dataType,
        imported: result.imported,
        skipped: result.skipped
      });
    }

    return result;
  } catch (error) {
    logger.error('Excel import failed', error as Error, { schoolId });
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [{
        row: 0,
        column: '',
        value: '',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      message: 'Failed to process Excel file',
    };
  }
}

async function processManualImport(
  schoolId: string, 
  data: any
): Promise<ImportResult> {
  // Manual entry - no actual import needed
  return {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
    message: 'Ready to add data manually after setup',
  };
}

export async function skipDataImport(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    // Mark import as skipped
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      message: 'Data import skipped - you can add data later',
    };

    revalidatePath(`/onboarding/${schoolId}`);
    return createActionResponse(result);
  } catch (error) {
    logger.error("Failed to skip data import", error as Error, { schoolId });
    return createActionResponse(undefined, error);
  }
}