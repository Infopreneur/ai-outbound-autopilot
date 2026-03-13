import type { DealRecord, DealStage } from '@/lib/types/deals'

type DealRow = {
  id: string
  name: string
  owner: string | null
  stage: string | null
  value: number | string | null
  probability: number | null
  deep_dive_note: string | null
  created_at: string
  company_id: string | null
  source_prospect_id: string | null
  companies?: {
    id: string
    name: string
  } | {
    id: string
    name: string
  }[] | null
}

function asStage(stage: string | null): DealStage {
  switch (stage) {
    case 'qualified':
    case 'demo':
    case 'proposal':
    case 'negotiation':
    case 'closed_won':
    case 'closed_lost':
      return stage
    default:
      return 'prospecting'
  }
}

function asNumber(value: number | string | null | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function mapDealRow(row: DealRow): DealRecord {
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies
  const createdAt = row.created_at ?? new Date().toISOString()
  const createdMs = new Date(createdAt).getTime()
  const diffMs = Number.isFinite(createdMs) ? Date.now() - createdMs : 0
  const daysInStage = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  return {
    id: row.id,
    name: row.name,
    company: company?.name ?? 'Unknown Company',
    companyId: row.company_id,
    sourceProspectId: row.source_prospect_id,
    contact: '',
    value: asNumber(row.value, 0),
    stage: asStage(row.stage),
    probability: asNumber(row.probability, 0),
    owner: row.owner ?? 'Alex Kim',
    daysInStage,
    closeDate: createdAt,
    deepDiveNote: row.deep_dive_note,
    createdAt,
  }
}
