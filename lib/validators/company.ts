/**
 * Zod schema for incoming company payloads.
 *
 * Uses Zod v4 API (error: instead of required_error/invalid_type_error,
 * and result.error.issues instead of result.error.errors).
 */

import { z } from 'zod'

// ─── Schema ───────────────────────────────────────────────────────────────────

export const CompanyRecordSchema = z.object({
  id: z.string().optional(),

  name: z
    .string()
    .min(1, 'Company name must not be empty.'),

  website: z
    .string()
    .url('website must be a valid URL (include https://).')
    .optional()
    .nullable(),

  industry: z.string().optional().nullable(),

  city:  z.string().optional().nullable(),
  state: z.string().optional().nullable(),

  employee_count: z
    .number()
    .int('employee_count must be an integer.')
    .min(0, 'employee_count must be non-negative.')
    .optional()
    .nullable(),

  linkedin_url: z
    .string()
    .url('linkedin_url must be a valid URL.')
    .optional()
    .nullable(),

  phone: z.string().optional().nullable(),

  // Stored analysis fields — may be present on update payloads
  analysis_summary:   z.string().optional().nullable(),
  fit_score:          z.number().optional().nullable(),
  pain_score:         z.number().optional().nullable(),
  reachability_score: z.number().optional().nullable(),
  timing_score:       z.number().optional().nullable(),
  total_score:        z.number().optional().nullable(),
  lead_status:        z.enum(['hot', 'warm', 'cold', 'new']).optional().nullable(),
})

export type ValidatedCompanyRecord = z.infer<typeof CompanyRecordSchema>

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Validate a raw payload against the schema.
 * Returns a typed success result or a formatted error message.
 */
export function validateCompany(raw: unknown):
  | { success: true; data: ValidatedCompanyRecord }
  | { success: false; error: string } {
  const result = CompanyRecordSchema.safeParse(raw)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Zod v4 uses .issues instead of .errors
  const messages = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  )
  return { success: false, error: messages.join('; ') }
}
