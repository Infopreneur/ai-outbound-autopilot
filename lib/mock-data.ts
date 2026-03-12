// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadStatus = 'hot' | 'warm' | 'cold' | 'contacted' | 'qualified' | 'disqualified'
export type DealStage = 'prospecting' | 'qualified' | 'demo' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
export type CampaignStatus = 'active' | 'paused' | 'draft' | 'completed'
export type CompanyStage = 'prospect' | 'engaged' | 'demo' | 'customer' | 'churned'

export interface Lead {
  id: string
  name: string
  firstName: string
  lastName: string
  title: string
  company: string
  companyId: string
  industry: string
  email: string
  phone: string
  location: string
  employees: string
  revenue: string
  score: number
  status: LeadStatus
  source: string
  tags: string[]
  lastActivity: string
  aiInsight: string
}

export interface Company {
  id: string
  name: string
  domain: string
  industry: string
  size: string
  location: string
  revenue: string
  stage: CompanyStage
  contacts: number
  score: number
  fundingStage: string
  description: string
  lastActivity: string
  technologies: string[]
}

export interface Deal {
  id: string
  name: string
  company: string
  companyId: string
  contact: string
  value: number
  stage: DealStage
  probability: number
  owner: string
  daysInStage: number
  closeDate: string
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  channel: 'email' | 'linkedin' | 'multi-channel'
  leads: number
  sent: number
  opened: number
  replied: number
  meetings: number
  openRate: number
  replyRate: number
  startDate: string
}

export interface ActivityItem {
  id: string
  type: 'ai' | 'email' | 'call' | 'meeting' | 'note' | 'enrichment'
  title: string
  description: string
  time: string
  meta?: string
}

export interface DemoTemplate {
  id: string
  name: string
  category: string
  description: string
  duration: string
  slides: number
  personalization: string[]
  thumbnail: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    firstName: 'Sarah',
    lastName: 'Chen',
    title: 'VP of Engineering',
    company: 'TechCorp Inc.',
    companyId: '1',
    industry: 'SaaS',
    email: 'sarah.chen@techcorp.com',
    phone: '+1 (415) 555-0123',
    location: 'San Francisco, CA',
    employees: '201–500',
    revenue: '$10M–50M',
    score: 94,
    status: 'hot',
    source: 'LinkedIn',
    tags: ['Decision Maker', 'Technical'],
    lastActivity: '2h ago',
    aiInsight: 'Recently hired 3 engineers — scaling pain likely',
  },
  {
    id: '2',
    name: 'Marcus Williams',
    firstName: 'Marcus',
    lastName: 'Williams',
    title: 'Head of Revenue Operations',
    company: 'GrowthHQ',
    companyId: '2',
    industry: 'MarTech',
    email: 'm.williams@growthhq.io',
    phone: '+1 (646) 555-0198',
    location: 'New York, NY',
    employees: '51–200',
    revenue: '$5M–10M',
    score: 88,
    status: 'warm',
    source: 'Inbound',
    tags: ['RevOps', 'Decision Maker'],
    lastActivity: '5h ago',
    aiInsight: 'Downloaded sales automation whitepaper twice',
  },
  {
    id: '3',
    name: 'Priya Nair',
    firstName: 'Priya',
    lastName: 'Nair',
    title: 'Chief Marketing Officer',
    company: 'ScaleForce',
    companyId: '3',
    industry: 'FinTech',
    email: 'priya@scaleforce.com',
    phone: '+1 (512) 555-0177',
    location: 'Austin, TX',
    employees: '101–200',
    revenue: '$5M–25M',
    score: 81,
    status: 'contacted',
    source: 'Cold Outreach',
    tags: ['C-Suite', 'Growth'],
    lastActivity: '1d ago',
    aiInsight: 'Competitor mention on LinkedIn 3 days ago',
  },
  {
    id: '4',
    name: 'David Park',
    firstName: 'David',
    lastName: 'Park',
    title: 'Director of Sales',
    company: 'Nexus Cloud',
    companyId: '4',
    industry: 'Cloud Infrastructure',
    email: 'd.park@nexuscloud.co',
    phone: '+1 (206) 555-0142',
    location: 'Seattle, WA',
    employees: '501–1000',
    revenue: '$50M–100M',
    score: 76,
    status: 'qualified',
    source: 'Referral',
    tags: ['Sales Leader', 'Enterprise'],
    lastActivity: '2d ago',
    aiInsight: 'Increased hiring in sales ops team this quarter',
  },
  {
    id: '5',
    name: 'Amelia Hart',
    firstName: 'Amelia',
    lastName: 'Hart',
    title: 'CEO & Co-Founder',
    company: 'Launchpad AI',
    companyId: '5',
    industry: 'AI/ML',
    email: 'amelia@launchpad.ai',
    phone: '+1 (650) 555-0199',
    location: 'Palo Alto, CA',
    employees: '11–50',
    revenue: '$1M–5M',
    score: 91,
    status: 'hot',
    source: 'LinkedIn',
    tags: ['Founder', 'ICP Match'],
    lastActivity: '4h ago',
    aiInsight: 'Just closed $4M seed — actively buying tools',
  },
  {
    id: '6',
    name: 'James Okafor',
    firstName: 'James',
    lastName: 'Okafor',
    title: 'VP of Product',
    company: 'Stride Platform',
    companyId: '6',
    industry: 'HR Tech',
    email: 'james@stridehq.com',
    phone: '+1 (312) 555-0134',
    location: 'Chicago, IL',
    employees: '51–200',
    revenue: '$5M–15M',
    score: 67,
    status: 'warm',
    source: 'Content',
    tags: ['Product', 'Champion'],
    lastActivity: '3d ago',
    aiInsight: 'Engaged with 4 blog posts on outbound strategy',
  },
  {
    id: '7',
    name: 'Leila Farahani',
    firstName: 'Leila',
    lastName: 'Farahani',
    title: 'SVP of Operations',
    company: 'Momentum Analytics',
    companyId: '7',
    industry: 'Analytics',
    email: 'l.farahani@momentum.io',
    phone: '+1 (617) 555-0156',
    location: 'Boston, MA',
    employees: '201–500',
    revenue: '$25M–75M',
    score: 72,
    status: 'cold',
    source: 'Database',
    tags: ['Operations', 'Enterprise'],
    lastActivity: '6d ago',
    aiInsight: 'No recent engagement — try new angle',
  },
  {
    id: '8',
    name: 'Ryan Torres',
    firstName: 'Ryan',
    lastName: 'Torres',
    title: 'Growth Lead',
    company: 'Spark Commerce',
    companyId: '8',
    industry: 'eCommerce',
    email: 'ryan@sparkcommerce.io',
    phone: '+1 (310) 555-0187',
    location: 'Los Angeles, CA',
    employees: '11–50',
    revenue: '$2M–10M',
    score: 85,
    status: 'hot',
    source: 'LinkedIn',
    tags: ['Growth', 'Fast Mover'],
    lastActivity: '1h ago',
    aiInsight: 'Asked about automation tools in Slack community',
  },
]

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    domain: 'techcorp.com',
    industry: 'SaaS',
    size: '201–500',
    location: 'San Francisco, CA',
    revenue: '$10M–50M',
    stage: 'engaged',
    contacts: 5,
    score: 87,
    fundingStage: 'Series B',
    description: 'B2B sales automation platform for mid-market teams.',
    lastActivity: '3h ago',
    technologies: ['Salesforce', 'HubSpot', 'Slack', 'AWS'],
  },
  {
    id: '2',
    name: 'GrowthHQ',
    domain: 'growthhq.io',
    industry: 'MarTech',
    size: '51–200',
    location: 'New York, NY',
    revenue: '$5M–10M',
    stage: 'demo',
    contacts: 3,
    score: 79,
    fundingStage: 'Series A',
    description: 'Revenue intelligence platform for B2B companies.',
    lastActivity: '5h ago',
    technologies: ['HubSpot', 'Intercom', 'GCP'],
  },
  {
    id: '3',
    name: 'ScaleForce',
    domain: 'scaleforce.com',
    industry: 'FinTech',
    size: '101–200',
    location: 'Austin, TX',
    revenue: '$5M–25M',
    stage: 'prospect',
    contacts: 2,
    score: 71,
    fundingStage: 'Seed',
    description: 'Embedded finance infrastructure for SaaS companies.',
    lastActivity: '1d ago',
    technologies: ['Stripe', 'AWS', 'Zendesk'],
  },
  {
    id: '4',
    name: 'Nexus Cloud',
    domain: 'nexuscloud.co',
    industry: 'Cloud Infrastructure',
    size: '501–1000',
    location: 'Seattle, WA',
    revenue: '$50M–100M',
    stage: 'engaged',
    contacts: 8,
    score: 83,
    fundingStage: 'Series C',
    description: 'Cloud security and compliance for enterprise.',
    lastActivity: '2d ago',
    technologies: ['AWS', 'Azure', 'Datadog', 'PagerDuty'],
  },
  {
    id: '5',
    name: 'Launchpad AI',
    domain: 'launchpad.ai',
    industry: 'AI/ML',
    size: '11–50',
    location: 'Palo Alto, CA',
    revenue: '$1M–5M',
    stage: 'demo',
    contacts: 2,
    score: 92,
    fundingStage: 'Seed',
    description: 'AI-powered product development platform.',
    lastActivity: '4h ago',
    technologies: ['OpenAI', 'Vercel', 'Supabase'],
  },
  {
    id: '6',
    name: 'Stride Platform',
    domain: 'stridehq.com',
    industry: 'HR Tech',
    size: '51–200',
    location: 'Chicago, IL',
    revenue: '$5M–15M',
    stage: 'prospect',
    contacts: 1,
    score: 64,
    fundingStage: 'Series A',
    description: 'Performance management and OKR platform.',
    lastActivity: '3d ago',
    technologies: ['Slack', 'BambooHR', 'Azure'],
  },
  {
    id: '7',
    name: 'Momentum Analytics',
    domain: 'momentum.io',
    industry: 'Analytics',
    size: '201–500',
    location: 'Boston, MA',
    revenue: '$25M–75M',
    stage: 'customer',
    contacts: 6,
    score: 95,
    fundingStage: 'Series B',
    description: 'Real-time data analytics for operations teams.',
    lastActivity: '6d ago',
    technologies: ['Snowflake', 'dbt', 'Looker', 'AWS'],
  },
  {
    id: '8',
    name: 'Spark Commerce',
    domain: 'sparkcommerce.io',
    industry: 'eCommerce',
    size: '11–50',
    location: 'Los Angeles, CA',
    revenue: '$2M–10M',
    stage: 'engaged',
    contacts: 2,
    score: 78,
    fundingStage: 'Pre-Seed',
    description: 'Headless commerce for DTC brands.',
    lastActivity: '1h ago',
    technologies: ['Shopify', 'Vercel', 'Klaviyo'],
  },
]

export const mockDeals: Deal[] = [
  { id: '1', name: 'TechCorp — Enterprise', company: 'TechCorp Inc.', companyId: '1', contact: 'Sarah Chen', value: 48000, stage: 'proposal', probability: 70, owner: 'Alex Kim', daysInStage: 5, closeDate: '2025-04-15' },
  { id: '2', name: 'GrowthHQ — Growth Plan', company: 'GrowthHQ', companyId: '2', contact: 'Marcus Williams', value: 24000, stage: 'demo', probability: 50, owner: 'Jamie Lee', daysInStage: 3, closeDate: '2025-04-22' },
  { id: '3', name: 'Launchpad AI — Starter', company: 'Launchpad AI', companyId: '5', contact: 'Amelia Hart', value: 12000, stage: 'qualified', probability: 40, owner: 'Alex Kim', daysInStage: 7, closeDate: '2025-05-01' },
  { id: '4', name: 'Nexus Cloud — Pro', company: 'Nexus Cloud', companyId: '4', contact: 'David Park', value: 96000, stage: 'negotiation', probability: 80, owner: 'Sam Rivera', daysInStage: 2, closeDate: '2025-04-08' },
  { id: '5', name: 'Spark Commerce — Team', company: 'Spark Commerce', companyId: '8', contact: 'Ryan Torres', value: 18000, stage: 'demo', probability: 55, owner: 'Jamie Lee', daysInStage: 1, closeDate: '2025-04-29' },
  { id: '6', name: 'ScaleForce — Business', company: 'ScaleForce', companyId: '3', contact: 'Priya Nair', value: 30000, stage: 'prospecting', probability: 20, owner: 'Alex Kim', daysInStage: 10, closeDate: '2025-05-15' },
  { id: '7', name: 'Stride Platform — Core', company: 'Stride Platform', companyId: '6', contact: 'James Okafor', value: 15000, stage: 'prospecting', probability: 15, owner: 'Sam Rivera', daysInStage: 6, closeDate: '2025-05-20' },
  { id: '8', name: 'Momentum Analytics — Ent.', company: 'Momentum Analytics', companyId: '7', contact: 'Leila Farahani', value: 120000, stage: 'closed_won', probability: 100, owner: 'Alex Kim', daysInStage: 0, closeDate: '2025-03-10' },
  { id: '9', name: 'TechCorp — Renewal', company: 'TechCorp Inc.', companyId: '1', contact: 'Sarah Chen', value: 52000, stage: 'negotiation', probability: 85, owner: 'Jamie Lee', daysInStage: 4, closeDate: '2025-04-05' },
  { id: '10', name: 'GrowthHQ — Upsell', company: 'GrowthHQ', companyId: '2', contact: 'Marcus Williams', value: 8000, stage: 'qualified', probability: 45, owner: 'Sam Rivera', daysInStage: 9, closeDate: '2025-05-10' },
]

export const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Q1 SaaS Outbound', status: 'active', channel: 'multi-channel', leads: 250, sent: 194, opened: 102, replied: 28, meetings: 11, openRate: 52.6, replyRate: 14.4, startDate: '2025-01-15' },
  { id: '2', name: 'FinTech Decision Makers', status: 'active', channel: 'linkedin', leads: 120, sent: 98, opened: 61, replied: 14, meetings: 5, openRate: 62.2, replyRate: 14.3, startDate: '2025-02-01' },
  { id: '3', name: 'Series A Founders', status: 'paused', channel: 'email', leads: 85, sent: 60, opened: 27, replied: 6, meetings: 2, openRate: 45.0, replyRate: 10.0, startDate: '2025-01-28' },
  { id: '4', name: 'Cloud Infra Buyers', status: 'completed', channel: 'email', leads: 300, sent: 300, opened: 163, replied: 42, meetings: 18, openRate: 54.3, replyRate: 14.0, startDate: '2024-12-01' },
  { id: '5', name: 'HR Tech Champions', status: 'draft', channel: 'multi-channel', leads: 0, sent: 0, opened: 0, replied: 0, meetings: 0, openRate: 0, replyRate: 0, startDate: '2025-03-20' },
]

export const mockActivity: ActivityItem[] = [
  { id: '1', type: 'ai', title: 'AI Prospecting Complete', description: 'Identified 48 new prospects matching your ICP in SaaS/FinTech.', time: '4m ago', meta: '+48 leads' },
  { id: '2', type: 'email', title: 'Email Sequence Launched', description: 'Q1 SaaS Outbound campaign started for 250 prospects.', time: '1h ago', meta: '250 emails' },
  { id: '3', type: 'meeting', title: 'Meeting Booked', description: 'Amelia Hart (Launchpad AI) confirmed demo for tomorrow 2pm.', time: '2h ago', meta: 'Demo' },
  { id: '4', type: 'enrichment', title: 'Data Enriched', description: 'Enriched 120 leads with LinkedIn, firmographic, and tech stack data.', time: '3h ago', meta: '120 records' },
  { id: '5', type: 'ai', title: 'AI Insight Generated', description: 'TechCorp Inc. increased job postings by 40% — potential expansion signal.', time: '5h ago', meta: 'TechCorp' },
  { id: '6', type: 'call', title: 'Discovery Call Logged', description: 'David Park (Nexus Cloud) — strong interest in enterprise plan. Moving to proposal.', time: '6h ago', meta: 'Nexus Cloud' },
  { id: '7', type: 'email', title: 'Reply Detected', description: 'Marcus Williams replied to Day 3 email. Sentiment: Positive.', time: '8h ago', meta: '+1 reply' },
  { id: '8', type: 'ai', title: 'Campaign Optimized', description: 'AI adjusted send times for FinTech Decision Makers — projected +8% open rate.', time: '12h ago', meta: 'Optimization' },
]

export const mockDemoTemplates: DemoTemplate[] = [
  { id: '1', name: 'Sales Automation Demo', category: 'Core Product', description: 'Full walkthrough of AI prospecting, enrichment, and outreach automation.', duration: '18 min', slides: 24, personalization: ['Company Name', 'ICP', 'Pain Points'], thumbnail: '' },
  { id: '2', name: 'ROI Calculator Deck', category: 'Value Selling', description: 'Interactive ROI model customized to prospect\'s team size and current tools.', duration: '12 min', slides: 16, personalization: ['Team Size', 'Current Stack', 'Revenue Goal'], thumbnail: '' },
  { id: '3', name: 'Quick Discovery Call', category: 'Discovery', description: 'Lightweight discovery-focused demo to qualify interest and identify pain.', duration: '8 min', slides: 10, personalization: ['Company Name', 'Industry'], thumbnail: '' },
  { id: '4', name: 'Enterprise Pitch', category: 'Enterprise', description: 'Security, compliance, and enterprise integration highlights for large orgs.', duration: '25 min', slides: 32, personalization: ['Company', 'IT Stack', 'Security Requirements'], thumbnail: '' },
  { id: '5', name: 'Founder Outbound Story', category: 'Storytelling', description: 'Origin story + product vision deck for founder-led sales motions.', duration: '15 min', slides: 20, personalization: ['Prospect Role', 'Company Stage'], thumbnail: '' },
  { id: '6', name: 'Competitive Battle Card', category: 'Competitive', description: 'Head-to-head comparison customized to named competitor the prospect uses.', duration: '10 min', slides: 14, personalization: ['Competitor', 'Pain Points'], thumbnail: '' },
]

export const kpiData = [
  { title: 'Total Leads', value: '12,847', change: 12.5, changeLabel: 'vs. last month', color: 'indigo' },
  { title: 'Meetings Booked', value: '89', change: 22.4, changeLabel: 'vs. last month', color: 'emerald' },
  { title: 'Active Campaigns', value: '24', change: 4.2, changeLabel: 'vs. last month', color: 'violet' },
  { title: 'Pipeline Value', value: '$2.4M', change: 18.7, changeLabel: 'vs. last month', color: 'amber' },
]
