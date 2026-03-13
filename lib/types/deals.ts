export const DEAL_STAGES = [
  'prospecting',
  'qualified',
  'demo',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const

export type DealStage = typeof DEAL_STAGES[number]

export interface DealRecord {
  id: string
  name: string
  company: string
  companyId: string | null
  sourceProspectId: string | null
  contact: string
  value: number
  stage: DealStage
  probability: number
  owner: string
  daysInStage: number
  closeDate: string
  deepDiveNote: string | null
  createdAt: string
}
