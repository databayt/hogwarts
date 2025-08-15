import { z } from 'zod';

export const importSchema = z.object({
  dataSource: z.enum(['manual', 'csv', 'existing-system'], {
    required_error: "Please select a data source",
  }),
  includeStudents: z.boolean().default(true),
  includeTeachers: z.boolean().default(true),
  includeParents: z.boolean().default(true),
  csvFile: z.string().optional(),
});

export type ImportFormData = z.infer<typeof importSchema>;