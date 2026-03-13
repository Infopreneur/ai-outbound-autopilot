import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { mapDealRow } from '@/lib/deals'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select(`
      id,
      name,
      owner,
      stage,
      value,
      probability,
      deep_dive_note,
      created_at,
      company_id,
      source_prospect_id,
      companies:company_id ( id, name )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    deals: (data ?? []).map(mapDealRow),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const companyId = typeof body.companyId === 'string' ? body.companyId : ''
  const owner = typeof body.owner === 'string' && body.owner.trim() ? body.owner.trim() : 'Alex Kim'
  const stage = typeof body.stage === 'string' && body.stage.trim() ? body.stage.trim() : 'prospecting'
  const nameOverride = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null
  const deepDiveNoteOverride = typeof body.deepDiveNote === 'string' && body.deepDiveNote.trim()
    ? body.deepDiveNote.trim()
    : null

  if (!companyId) {
    return NextResponse.json({ error: '"companyId" is required.' }, { status: 422 })
  }

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id, name, deep_dive_note, converted_to_deal')
    .eq('id', companyId)
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 })
  }

  const { data: existingDeal, error: existingError } = await supabaseAdmin
    .from('deals')
    .select(`
      id,
      name,
      owner,
      stage,
      value,
      probability,
      deep_dive_note,
      created_at,
      company_id,
      source_prospect_id,
      companies:company_id ( id, name )
    `)
    .eq('source_prospect_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existingDeal) {
    await supabaseAdmin
      .from('companies')
      .update({ converted_to_deal: true })
      .eq('id', companyId)

    return NextResponse.json({
      deal: mapDealRow(existingDeal),
      reused: true,
    })
  }

  const dealName = nameOverride ?? `${company.name} - Demo`
  const deepDiveNote = deepDiveNoteOverride ?? company.deep_dive_note ?? null

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('deals')
    .insert({
      company_id: company.id,
      source_prospect_id: company.id,
      name: dealName,
      owner,
      stage,
      deep_dive_note: deepDiveNote,
      value: null,
      probability: null,
    })
    .select(`
      id,
      name,
      owner,
      stage,
      value,
      probability,
      deep_dive_note,
      created_at,
      company_id,
      source_prospect_id,
      companies:company_id ( id, name )
    `)
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create deal.' }, { status: 500 })
  }

  const { error: updateError } = await supabaseAdmin
    .from('companies')
    .update({ converted_to_deal: true })
    .eq('id', companyId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    deal: mapDealRow(inserted),
    reused: false,
  }, { status: 201 })
}
