/**
 * lib/discovery/industries.ts
 *
 * Industry presets for the discovery engine.
 *
 * Each preset defines:
 *  - keywords: search terms to run against Google Places (one API call each)
 *  - minReviews: minimum review count to consider a lead "qualified"
 *  - signals: website signals that indicate the business is reachable
 *
 * The discovery engine runs every keyword as a separate search and
 * deduplicates results by place_id, so you get 3× more coverage per job.
 */

export type WebsiteSignal =
  | 'contact_form'
  | 'phone_number'
  | 'lead_form'
  | 'booking_widget'
  | 'chat_widget'
  | 'email_address'

export interface IndustryPreset {
  keywords:   string[]
  minReviews: number
  signals:    WebsiteSignal[]
}

export const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {

  roofing: {
    keywords:   ['roofing contractor', 'roof repair', 'roof replacement'],
    minReviews: 50,
    signals:    ['contact_form', 'phone_number'],
  },

  solar: {
    keywords:   ['solar installer', 'solar company', 'solar energy contractor'],
    minReviews: 30,
    signals:    ['lead_form', 'phone_number'],
  },

  medspa: {
    keywords:   ['med spa', 'medical spa', 'aesthetic clinic'],
    minReviews: 40,
    signals:    ['booking_widget', 'contact_form'],
  },

  plumbing: {
    keywords:   ['plumber', 'plumbing contractor', 'plumbing services'],
    minReviews: 40,
    signals:    ['phone_number', 'contact_form'],
  },

  hvac: {
    keywords:   ['HVAC contractor', 'air conditioning repair', 'heating and cooling company'],
    minReviews: 40,
    signals:    ['phone_number', 'contact_form'],
  },

  landscaping: {
    keywords:   ['landscaping company', 'lawn care service', 'landscape contractor'],
    minReviews: 30,
    signals:    ['contact_form', 'phone_number'],
  },

  dentist: {
    keywords:   ['dentist', 'dental clinic', 'family dentistry'],
    minReviews: 50,
    signals:    ['booking_widget', 'contact_form', 'phone_number'],
  },

  chiropractor: {
    keywords:   ['chiropractor', 'chiropractic clinic', 'chiropractic care'],
    minReviews: 30,
    signals:    ['booking_widget', 'contact_form'],
  },

  realEstate: {
    keywords:   ['real estate agent', 'realtor', 'real estate broker'],
    minReviews: 20,
    signals:    ['lead_form', 'contact_form', 'phone_number'],
  },

  autoRepair: {
    keywords:   ['auto repair shop', 'car mechanic', 'auto body shop'],
    minReviews: 50,
    signals:    ['phone_number', 'contact_form'],
  },

  electrician: {
    keywords:   ['electrician', 'electrical contractor', 'electrical services'],
    minReviews: 30,
    signals:    ['phone_number', 'contact_form'],
  },

  pestControl: {
    keywords:   ['pest control', 'exterminator', 'pest control company'],
    minReviews: 30,
    signals:    ['phone_number', 'contact_form', 'lead_form'],
  },

  windowsCleaning: {
    keywords:   ['window cleaning service', 'window washer', 'commercial window cleaning'],
    minReviews: 20,
    signals:    ['phone_number', 'contact_form'],
  },

  homeCleaning: {
    keywords:   ['house cleaning service', 'maid service', 'residential cleaning company'],
    minReviews: 30,
    signals:    ['booking_widget', 'contact_form', 'phone_number'],
  },

  insurance: {
    keywords:   ['insurance agent', 'insurance broker', 'insurance agency'],
    minReviews: 20,
    signals:    ['lead_form', 'contact_form', 'phone_number'],
  },

}

/** All available industry keys, sorted for display */
export const INDUSTRY_KEYS = Object.keys(INDUSTRY_PRESETS).sort() as (keyof typeof INDUSTRY_PRESETS)[]

/** Human-readable label for a given industry key */
export function industryLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}
