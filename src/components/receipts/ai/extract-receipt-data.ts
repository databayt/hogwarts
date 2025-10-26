/**
 * AI-Powered Receipt Data Extraction
 * Uses Vercel AI SDK with Claude 3.5 Sonnet for OCR
 * Follows Hogwarts server action pattern
 */

'use server'

import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { extractedReceiptDataSchema } from '../validation'

/**
 * Extract structured data from receipt image/PDF using Claude 3.5 Sonnet
 * @param receiptId - Database ID of the receipt record
 * @param fileUrl - Public URL of the uploaded receipt file
 */
export async function extractReceiptData(receiptId: string, fileUrl: string) {
  try {
    // Update status to processing
    await db.expenseReceipt.update({
      where: { id: receiptId },
      data: { status: 'processing' },
    })

    logger.info('Starting receipt data extraction', {
      action: 'extract_receipt_data',
      receiptId,
      fileUrl,
    })

    // Extract data using Vercel AI SDK with Claude 3.5 Sonnet
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: extractedReceiptDataSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: fileUrl,
            },
            {
              type: 'text',
              text: `Extract all information from this receipt and return structured JSON data.

Instructions:
1. Extract merchant information (name, address, contact)
2. Extract transaction details (date, amount, currency)
3. Extract all line items with quantity, unit price, and total price
4. Create a concise summary of the receipt
5. Ensure all amounts are in decimal format
6. Ensure dates are in ISO 8601 format (YYYY-MM-DD)

If any information is not clearly visible, use empty string or 0 for numbers.`,
            },
          ],
        },
      ],
    })

    logger.info('Receipt data extraction completed', {
      action: 'extract_receipt_data_success',
      receiptId,
      merchantName: result.object.merchantName,
      itemCount: result.object.items.length,
    })

    // Update database with extracted data
    await db.expenseReceipt.update({
      where: { id: receiptId },
      data: {
        merchantName: result.object.merchantName,
        merchantAddress: result.object.merchantAddress,
        merchantContact: result.object.merchantContact,
        transactionDate: new Date(result.object.transactionDate),
        transactionAmount: parseFloat(result.object.transactionAmount),
        currency: result.object.currency,
        receiptSummary: result.object.receiptSummary,
        items: result.object.items,
        status: 'processed',
        processedAt: new Date(),
      },
    })

    logger.info('Receipt database updated successfully', {
      action: 'receipt_db_update',
      receiptId,
    })

    return {
      success: true,
      data: result.object,
    }
  } catch (error) {
    logger.error(
      'Receipt data extraction failed',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'extract_receipt_data_error',
        receiptId,
      }
    )

    // Mark receipt as error
    await db.expenseReceipt.update({
      where: { id: receiptId },
      data: {
        status: 'error',
      },
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
    }
  }
}

/**
 * Retry extraction for failed receipts
 * @param receiptId - Database ID of the receipt record
 */
export async function retryExtraction(receiptId: string) {
  try {
    const receipt = await db.expenseReceipt.findUnique({
      where: { id: receiptId },
      select: { id: true, fileUrl: true, status: true },
    })

    if (!receipt) {
      throw new Error('Receipt not found')
    }

    if (receipt.status !== 'error' && receipt.status !== 'pending') {
      throw new Error('Can only retry failed or pending receipts')
    }

    return await extractReceiptData(receipt.id, receipt.fileUrl)
  } catch (error) {
    logger.error(
      'Receipt extraction retry failed',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'retry_extraction_error',
        receiptId,
      }
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Retry failed',
    }
  }
}
