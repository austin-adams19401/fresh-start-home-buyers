// Chat assistant for adamsfreshstart.com
// Netlify Function (v2). Answers visitor questions and, when the visitor is ready,
// submits their details to the existing `seller-lead` Netlify Form so chat leads
// land in the same inbox as web-form leads.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const MODEL = 'claude-opus-5-5';
// Cheaper alternative if chat volume ever matters: 'claude-haiku-4-5'
// (roughly 4x lower cost; drop `output_config` if you switch, Haiku 4.5 does not support effort).

const PHONE = '(385) 244-0881';
const MAX_MESSAGES = 30;
const MAX_CHARS = 1000;

const SITUATIONS = [
  'Inherited home',
  'Behind on payments',
  'Divorce or life change',
  'Tired landlord / rental',
  'Needs major repairs',
  'Relocating / downsizing',
  'Just exploring',
] as const;
const TIMELINES = ['ASAP', 'Within 30 days', '1 to 3 months', 'Just researching'] as const;

const SYSTEM = `You are the website assistant for Fresh Start Home Buyers (adamsfreshstart.com), run by Austin Adams, a local real estate investor in Kaysville, Utah. Austin buys houses across Davis and Weber Counties (Kaysville, Layton, Farmington, Syracuse, Clearfield, Ogden, Roy, Bountiful, and the surrounding Wasatch Front).

Your two jobs:
1. Answer questions about how selling to Austin works, in plain, warm, honest language.
2. When the visitor is interested, collect their details one question at a time and submit them with the submit_lead tool so Austin can follow up personally.

What Austin offers (four routes):
- Cash offer, as-is: no repairs, no cleaning, no showings, no agent commissions. Austin covers typical closing costs. Can close in as little as 10 days or on the seller's chosen date. Offer = after-repair value minus repairs, holding/resale costs, and a margin. Below retail price, in exchange for speed and certainty.
- Creative financing: seller financing (seller carries a note secured by a recorded lien), subject-to (Austin takes over the existing mortgage payments), or lease option. Often nets the seller more, especially when equity is thin, when they want monthly income, or for tax planning. Everything closes at a Utah title company with attorney-drafted documents.
- List with an agent: if the home is in good shape and the seller has time, a listing usually nets more. Austin says so and refers to a trusted agent.
- Landlords and portfolios: Austin buys occupied or vacant rentals, honors leases, buys single units or whole portfolios.

Process: reach out, quick walkthrough (in person or video), real options within 24 to 48 hours, sign and pick a date, close at a local title company. No obligation at any point. Austin personally reads every message and usually replies the same day.

Hard rules:
- NEVER quote, estimate, or hint at an offer amount, price, or percentage of value for a specific property. If asked, say Austin has to see the property and the numbers first, and offer to collect their details so he can.
- NEVER give legal, tax, or financial advice. Suggest they talk to an attorney or CPA for those questions.
- Do not make promises on Austin's behalf beyond what is stated above.
- Do not discuss topics unrelated to selling a house in Utah. Politely steer back.
- Keep replies under 80 words. Ask ONE question at a time. Plain text only, no markdown, no bullet lists, no headers.
- Be warm and human. Many visitors are stressed. Never pressure anyone.
- If the visitor prefers to talk, give Austin's number: ${PHONE} (call or text).

Collecting a lead: you need name, phone, and property address. Also ask about their situation and timeline if not already clear, and note anything relevant. Email is optional. Once you have name, phone, and address, call submit_lead immediately (do not ask for permission again). After the tool succeeds, confirm briefly, say Austin will reach out personally, usually the same day, and remind them they can call or text ${PHONE} any time. Do not submit twice in one conversation.`;

const LeadSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(7).max(40),
  email: z.string().max(200),
  property_address: z.string().min(3).max(240),
  situation: z.enum(SITUATIONS),
  timeline: z.enum(TIMELINES),
  notes: z.string().max(2000),
});

const submitLeadTool: Anthropic.Beta.BetaToolUnion = {
  name: 'submit_lead',
  description:
    'Submit the visitor\'s contact details and property info to Austin. Call this as soon as you have at least the name, phone number, and property address. Use "Just exploring" / "Just researching" when the visitor has not said otherwise. Use an empty string for email if not provided.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Visitor full name' },
      phone: { type: 'string', description: 'Phone number as given' },
      email: { type: 'string', description: 'Email address, or empty string if not given' },
      property_address: { type: 'string', description: 'Street address and city of the property' },
      situation: { type: 'string', enum: [...SITUATIONS] },
      timeline: { type: 'string', enum: [...TIMELINES] },
      notes: { type: 'string', description: 'Short summary of anything else relevant the visitor shared (condition, tenants, mortgage, questions). Empty string if nothing.' },
    },
    required: ['name', 'phone', 'email', 'property_address', 'situation', 'timeline', 'notes'],
    additionalProperties: false,
  },
};

const ChatBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(MAX_CHARS * 4) }))
    .min(1)
    .max(MAX_MESSAGES),
  page: z.string().max(200).optional(),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const fallbackReply = `Sorry, I’m having trouble right now. You can call or text Austin directly at ${PHONE}.`;

async function submitToNetlifyForms(lead: z.infer<typeof LeadSchema>, page: string): Promise<boolean> {
  const siteUrl = process.env.URL;
  if (!siteUrl) {
    console.warn('submit_lead: process.env.URL not set, skipping form post', lead);
    return false;
  }
  const body = new URLSearchParams({
    'form-name': 'seller-lead',
    source: 'chat',
    page,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    property_address: lead.property_address,
    situation: lead.situation,
    timeline: lead.timeline,
    message: lead.notes,
  });
  const res = await fetch(`${siteUrl}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    console.error('submit_lead: Netlify Forms responded', res.status, await res.text().catch(() => ''));
    return false;
  }
  console.log('submit_lead: lead submitted for', lead.property_address);
  return true;
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Only accept requests from this site.
  const siteUrl = process.env.URL;
  const origin = req.headers.get('origin') ?? '';
  if (siteUrl && origin && !origin.startsWith(siteUrl) && !origin.startsWith('http://localhost')) {
    return json({ error: 'Forbidden' }, 403);
  }

  let parsed: z.infer<typeof ChatBody>;
  try {
    parsed = ChatBody.parse(await req.json());
  } catch {
    return json({ reply: 'I didn’t catch that. Could you try again?', leadSubmitted: false }, 400);
  }

  const last = parsed.messages[parsed.messages.length - 1];
  if (last.role !== 'user' || last.content.trim().length === 0) {
    return json({ reply: 'What can I help you with?', leadSubmitted: false }, 400);
  }
  if (last.content.length > MAX_CHARS) {
    return json({ reply: 'That message is a bit long for me. Could you shorten it, or just call Austin at ' + PHONE + '?', leadSubmitted: false });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return json({ reply: fallbackReply, leadSubmitted: false }, 500);
  }

  const client = new Anthropic();
  const page = parsed.page ?? '/';

  const messages: Anthropic.Beta.BetaMessageParam[] = parsed.messages.map((m) => ({ role: m.role, content: m.content }));
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `The visitor is currently on the page: ${page}` },
  ];

  const request = {
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: 'low' as const },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default' as const,
    system,
    tools: [submitLeadTool],
    messages,
  };

  let leadSubmitted = false;

  try {
    let response = await client.beta.messages.create(request);

    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      if (toolUse && toolUse.name === 'submit_lead') {
        const lead = LeadSchema.safeParse(toolUse.input);
        let resultText: string;
        if (!lead.success) {
          resultText = 'Error: the details were incomplete or invalid. Ask the visitor to confirm their name, phone, and address.';
        } else {
          const ok = await submitToNetlifyForms(lead.data, page);
          leadSubmitted = ok;
          resultText = ok
            ? 'Success. The lead was delivered to Austin.'
            : `The lead could not be delivered automatically. Apologize briefly and ask the visitor to call or text Austin at ${PHONE} or use the form on the page.`;
        }
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: resultText }],
        });
        // Second (final) round. tool_choice none is not needed; instructions prevent a second submit.
        response = await client.beta.messages.create({ ...request, messages });
      }
    }

    if (response.stop_reason === 'refusal') {
      return json({ reply: `I can’t help with that one. For anything about selling a house, I’m here, or you can reach Austin at ${PHONE}.`, leadSubmitted });
    }

    const reply = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return json({ reply: reply || fallbackReply, leadSubmitted });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.error('chat: rate limited');
      return json({ reply: `I’m getting a lot of messages right now. Please try again in a minute, or text Austin at ${PHONE}.`, leadSubmitted }, 429);
    }
    if (err instanceof Anthropic.APIError) {
      console.error('chat: API error', err.status, err.message);
    } else {
      console.error('chat: unexpected error', err);
    }
    return json({ reply: fallbackReply, leadSubmitted }, 500);
  }
};
