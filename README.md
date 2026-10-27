# Kanasu V. | Developer Portfolio

A pastel 3D portfolio built with Next.js, TypeScript, Tailwind CSS v4, React Three Fiber and Framer Motion.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm run lint
npm run typecheck
```

## Where things live

| What | Where |
|---|---|
| All text, projects, skills, achievements, links | `data/content.ts` |
| Hero character (2.5D, cursor parallax) | `components/Character.tsx`, art in `public/character.webp` |
| 3D world (islands, clouds, project gems) | `components/scene/HeroScene.tsx` |
| WebGL detection + static fallback | `components/scene/SceneLayer.tsx` |
| Colors, fonts, design tokens | `app/globals.css` (`@theme`) |
| SEO metadata | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `public/og-image.jpg` |
| Resume served by the site | `public/resume.pdf` (includes your phone number) |

## Placeholders to fill in

Search for `TODO(Kanasu)` in `data/content.ts`:

- **Deepfake Detection System**: tech stack, approach, your role, repo/demo link.
- **Study Buddy** and **Smart Audit**: tech stack / architecture.
- **LearnSphere** and **College Management System**: description, stack, role, links (no source material was found for either).
- **Vintech** and **Find My Nest**: live and repo links.
- To add a link to any project, add `{ label: "GitHub", href: "https://..." }` to its `links` array; the "no public link" note can then be removed.

Not included until confirmed: the ₹3,000 state-level hackathon win.

## The hero character

The hero picks the best character available (`components/character/HeroCharacter.tsx`):

0. **Video clips** of you (the "walks in, says hi, looks around" effect). Put AI-generated clips in
   `public/character/video/` as `intro.mp4` (plays once per visit), `idle.mp4` (loops) and optionally
   `wave.mp4` (plays when clicked), then restart `npm run dev`. `.webm` also works. Keep each clip
   720p, muted-friendly, under ~4 MB.

   **Green-screen clips** (intro, idle, laptop and contact are made this way): put the original in
   `media/green/<clip>.mp4` and run `python scripts/green_screen.py` (needs `pip install imageio-ffmpeg numpy`).
   It writes a transparent `<clip>.webm` for Chrome/Edge/Firefox and a `<clip>.mp4` on a flat lavender for
   Safari/iOS, which can't play transparent video. The original room versions of wave, spin and celebrate are
   kept in `media/room/`. If a new clip doesn't line up with the cursor-tracking frames at the hand-off,
   adjust its entry in `CLIP_FIT` (`components/character/config.ts`). The `contact` clip plays when Contact opens.
1. **Cursor-tracking frames** (the "her eyes follow your cursor" effect). Your illustration is
   re-posed by AI into a grid of head/eye directions, plus blink, smile and talking-mouth frames,
   and the site shows the frame that matches the cursor. Generate them once:

   ```powershell
   $env:REPLICATE_API_TOKEN = "r8_..."   # from https://replicate.com/account/api-tokens
   npm run gaze:generate                 # ~40 images, about $0.08, saved to public/character/gaze/
   npm run dev                           # restart so the site detects the frames
   ```

   This uploads `character-reference.png` to Replicate (`fofr/expression-editor`, built on LivePortrait).
   If she looks the opposite way to the cursor, run `npm run gaze:generate -- --only-manifest --flip`.
2. **A rigged 3D VRM** at `public/models/kanasu.vrm`, if one is added (see `components/character/vrm/`).
   `?model=sample` previews pixiv's generic anime sample (labelled "not Kanasu") for pipeline testing.
3. **The illustrated portrait** fallback, also used without WebGL or if loading fails.

Every mode has the greeting, speech bubble (× or Esc to dismiss) and click reaction. The frames and
VRM modes also have an opt-in voice (browser speech synthesis, "Sound off" by default). Add `?greet` to replay the greeting,
`?model=portrait` to force the fallback.

## AI Recruiter chat

A floating "Ask my AI recruiter" chat (also opened from the Contact section) answers recruiters'
questions using only the verified facts in `data/content.ts`, via Claude (`claude-opus-5-5` by default).

- **Server:** `app/api/ai-recruiter/chat/route.ts` (key stays server-side, same-origin only, input and
  history limits, per-IP rate limit, 30 s timeout, typed error handling, prompt caching, refusal fallback).
- **Knowledge + instructions:** `lib/recruiter/knowledge.ts` (built from the same data the page shows).
- **UI:** `components/recruiter/RecruiterChat.tsx`.

**Switch it on locally:** create `.env.local` (Git-ignored) containing `ANTHROPIC_API_KEY=<your key>`
from https://console.anthropic.com/settings/keys, then restart `npm run dev`. **On Vercel:** add
`ANTHROPIC_API_KEY` under Project → Settings → Environment Variables and redeploy. Never prefix it with
`NEXT_PUBLIC_`. Without a key the chat says it isn't switched on yet and never invents answers.

Cost control: answers are capped at 2,000 output tokens with low effort, and the system prompt is cached.
Set a monthly spend limit in the Anthropic Console. The built-in rate limit is per server instance; for heavy
traffic on serverless hosting, put a shared limiter (for example Upstash Redis) in front of the route.

## Deploying to Vercel

1. Push this folder to a new GitHub repository.
2. Import it at vercel.com/new (framework is detected automatically, no build settings needed).
3. After the first deploy, set `NEXT_PUBLIC_SITE_URL` to the real URL (see `.env.example`) and redeploy,
   so canonical links, Open Graph and the sitemap use the right domain.
