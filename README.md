# Fresh Start Home Buyers — adamsfreshstart.com

Marketing site for Fresh Start Home Buyers (Adams Real Estate Holdings, LLC). Astro static site on Netlify, with Netlify Forms for leads and one Netlify Function that powers the AI chat assistant.

## Structure

```
.
├── astro.config.mjs          # site URL, sitemap
├── netlify.toml              # build = npm run build, publish = dist, functions dir, headers, redirects
├── netlify/functions/chat.ts # AI chat assistant (Claude API) + lead submission
├── public/
│   ├── images/               # austin-square.jpg, austin-wide.jpg, og-default.jpg
│   ├── favicon.svg, robots.txt
├── src/
│   ├── site.ts               # phone, email, cities, nav, form option lists (edit here first)
│   ├── data/faqs.ts          # FAQ questions and answers
│   ├── styles/global.css     # brand tokens and shared styles
│   ├── layouts/BaseLayout.astro
│   ├── components/           # Header, Footer, LeadForm, ChatWidget, CompareTable, Faq, etc.
│   ├── content/situations/   # one markdown file per seller situation (auto-generates /situations/<id>/)
│   └── pages/                # one .astro file per route
```

Routes: `/`, `/sell-your-house/`, `/creative-financing/`, `/list-with-an-agent/`, `/landlords/`, `/how-it-works/`, `/compare/`, `/about/`, `/faq/`, `/situations/<id>/` (6), `/get-offer/`, `/thank-you/`, `/privacy/`.

## Local development

```bash
npm install
npm run dev          # Astro only, pages at http://localhost:4321 (chat function will not run)
npm run netlify      # Astro + functions at http://localhost:8888 (needs .env, see below)
npm run build        # production build into dist/
npm run check        # type check
```

For the chat to work locally, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. `.env` is gitignored.

In dev mode, anything marked as a placeholder shows a red dashed outline and a label. Nothing marked shows in production, except where noted below.

## Deploy (Netlify)

`netlify.toml` sets the build command and publish directory, so a normal Git deploy works. Two one-time steps in the Netlify UI:

1. **Environment variable:** Site configuration → Environment variables → add `ANTHROPIC_API_KEY`. Without it the chat replies with a "call or text Austin" fallback and never errors visibly.
2. **Forms:** Netlify detects the `seller-lead` form from the built HTML on the first deploy. Then go to Forms → Settings → Notifications and add an email notification to austin@adamsfreshstart.com. Both the web form and the chat assistant submit to this same form; the hidden `source` field says which (`web` or `chat`) and `page` says where.

Also set a **monthly spend limit** in the Anthropic console (Settings → Limits). That is the real ceiling on chat cost if a bot hammers the endpoint.

## The AI chat assistant

`netlify/functions/chat.ts`:

- Model: `claude-opus-5-5` at low effort, 1024 max output tokens, system prompt cached. Each visitor turn costs a fraction of a cent on a cache hit. To cut cost roughly 4x, switch `MODEL` to `claude-haiku-4-5` and delete the `output_config` line (Haiku 4.5 does not accept `effort`).
- Guardrails in the prompt: never quotes a price, never gives legal or tax advice, stays on topic, replies under 80 words, one question at a time.
- Guardrails in code: max 30 messages per conversation, 1,000 characters per message, origin check, typed error handling with a friendly fallback reply.
- Lead capture: a `submit_lead` tool with a strict schema. When the visitor has given name, phone, and address, the model calls it, the function POSTs to Netlify Forms, and the visitor gets a confirmation. The conversation is stored only in the visitor's browser session.
- To change what the assistant knows or how it talks, edit the `SYSTEM` string at the top of the file.

Netlify Forms only exist on deployed sites, so a locally submitted chat lead logs a warning instead of landing in the inbox. Test the full path once on the live site.

## Things to fill in

Search the repo for `PLACEHOLDER` to find every spot. Currently:

- `src/pages/list-with-an-agent.astro`: name the partner agent or brokerage and state whether a referral fee is involved.
- `src/pages/about.astro`: optional extra personal detail (years in Davis County, first deal, community involvement).
- `src/components/Testimonials.astro`: real seller quotes. Flip `showTestimonials` to `true` once they are in. The section is hidden in production until then.

## Editing copy

Every page is a plain `.astro` file with HTML-like markup. Situation pages are markdown in `src/content/situations/`. Contact details, city list, and the form's dropdown options live in `src/site.ts`. FAQ text lives in `src/data/faqs.ts`. Brand colors are CSS variables at the top of `src/styles/global.css`.

## Key details

- Domain: adamsfreshstart.com (Netlify DNS)
- Email: austin@adamsfreshstart.com (Google Workspace)
- Phone: (385) 244-0881 (Google Voice)
- Service area: Davis & Weber Counties, Utah
