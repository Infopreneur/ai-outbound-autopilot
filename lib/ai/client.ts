/**
 * AI provider abstraction.
 *
 * Wire ANTHROPIC_API_KEY (or OPENAI_API_KEY) in .env.local to activate a real
 * model. When neither key is present the MockAIClient is used, which returns
 * plausible hard-coded JSON so the feature works without credentials.
 */

import Anthropic from '@anthropic-ai/sdk'

// ─── Interface ───────────────────────────────────────────────────────────────

export interface AIClient {
  /**
   * Send a user message and receive a text completion.
   * @param userPrompt   - The main user-turn content
   * @param systemPrompt - Optional system instructions
   */
  complete(userPrompt: string, systemPrompt?: string): Promise<string>
}

// ─── Anthropic (Claude) ──────────────────────────────────────────────────────

class AnthropicClient implements AIClient {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async complete(userPrompt: string, systemPrompt?: string): Promise<string> {
    const msg = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: userPrompt }],
    })

    const block = msg.content[0]
    return block.type === 'text' ? block.text : ''
  }
}

// ─── Mock (no credentials required) ─────────────────────────────────────────

class MockAIClient implements AIClient {
  async complete(userPrompt: string): Promise<string> {
    // Detect which prompt type we're servicing by looking for keywords
    if (userPrompt.includes('DEMO CONTEXT')) {
      return JSON.stringify({
        headline: 'Show how an AI assistant can qualify leads and book appointments automatically.',
        scenario:
          'This company likely handles inbound leads manually, creating delays and missed opportunities. ' +
          'Show them how an AI-powered intake flow can respond instantly, qualify prospects, and book calls 24/7.',
        keyPoints: [
          'Instant AI response to every inbound lead',
          'Automatic qualification based on custom criteria',
          'Calendar booking without human involvement',
          'Follow-up sequences triggered by lead behaviour',
        ],
        suggestedFlow:
          'Landing page → AI chat widget → qualification questions → calendar embed → confirmation + nurture sequence.',
      })
    }

    if (userPrompt.includes('OUTREACH MESSAGE')) {
      return JSON.stringify({
        subjectLine: 'Quick idea for [Company]',
        messageBody:
          "Hi [First Name],\n\nI came across [Company] and noticed you're likely juggling a lot of manual follow-up to convert leads.\n\n" +
          "We help businesses like yours automate that entire process — from first contact to booked call — without adding headcount.\n\n" +
          "Worth a 15-minute chat to see if it could work for you?",
        cta: 'Would Tuesday or Wednesday work for a quick call?',
        channel: 'email',
      })
    }

    // Default → company analysis
    return JSON.stringify({
      summary:
        'This is a small-to-mid-sized business that likely relies on manual outreach and has limited marketing automation in place. ' +
        'They may be struggling to convert inbound interest into booked appointments efficiently.',
      painPoints: [
        'Manual lead follow-up causing slow response times',
        'No clear automated nurture sequence after first contact',
        'Website may lack a strong call-to-action or conversion path',
        'Likely losing leads to faster-responding competitors',
      ],
      strengths: [
        'Established local presence',
        'Clear service offering',
        'Active online presence',
      ],
      outreachAngle:
        'Lead response speed — most small businesses take 24–48 hours to follow up. AI closes that gap instantly.',
      urgencyLevel: 'medium',
      recommendedOffer:
        'AI-powered lead response + appointment booking system, free 14-day pilot.',
      recommendedChannel: 'email',
    })
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns the best available AI client based on environment variables.
 * Precedence: Anthropic → Mock
 */
export function getAIClient(): AIClient {
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicClient(process.env.ANTHROPIC_API_KEY)
  }
  console.warn('[AI Client] No ANTHROPIC_API_KEY found — using MockAIClient.')
  return new MockAIClient()
}
