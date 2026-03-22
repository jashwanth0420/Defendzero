import { z } from 'zod';

const medicineEntrySchema = z.object({
  name: z.string().min(1, 'Medicine name must not be empty'),
  composition: z.array(z.string().min(1, 'Composition ingredient must not be empty')).min(1, 'At least one composition item is required')
});

export const safetyCheckSchema = z.object({
  medicines: z.array(z.string().min(1, 'Medicine name must not be empty')).optional(),
  medicineEntries: z.array(medicineEntrySchema).optional(),
  pregnancyStage: z.enum(['first', 'second', 'third', 'unknown']).optional().default('unknown')
}).superRefine((payload, ctx) => {
  const hasLegacy = Array.isArray(payload.medicines) && payload.medicines.length > 0;
  const hasEntries = Array.isArray(payload.medicineEntries) && payload.medicineEntries.length > 0;

  if (!hasLegacy && !hasEntries) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide medicines[] or medicineEntries[] with at least one medicine.'
    });
  }
});

export type SafetyCheckSchemaInput = z.infer<typeof safetyCheckSchema>;
