ThreadCall

# Typography System

The complete type scale, weight specimens, color roles, and live UI specimens for ThreadCall — designed for consistency across landing, auth, and workspace surfaces.

Typefaces

DM Sans

Display / Headings

Used for all headings, logo, nav, and large hero text. Light weight (300) at display sizes — heavy weight at small sizes.

Inter

Body / UI

Used for body text, labels, form fields, descriptions, and all UI copy. Neutral and highly legible at small sizes.

DM Mono

Code / Metadata

Used for code snippets, tags, overlines, version strings, and technical metadata labels.

Type scale

display 48px · DM Sans 300 tracking −0.04em · lh 1.05

ThreadCall

Hero headline only

h1 32px · DM Sans 400 tracking −0.03em · lh 1.1

Welcome back

Page-level headings

h2 22px · DM Sans 400 tracking −0.02em · lh 1.2

Your workspaces

Section headings

h3 16px · DM Sans 500 tracking −0.01em · lh 1.3

Acme Engineering

Card titles, subsections

h4 13px · Inter 500 tracking 0 · lh 1.4

No workspaces yet

Empty states, inline titles

body-lg 15px · Inter 400 tracking 0 · lh 1.7

Start a call from any message thread. When it ends, AI posts the decisions back automatically.

Hero subheading

body 13px · Inter 400 tracking 0 · lh 1.65

Choose a workspace to get started with your team. You can switch between workspaces at any time.

General body copy

body-sm 11px · Inter 400 tracking 0 · lh 1.6

By continuing you agree to our terms and privacy policy. Your data is never sold to third parties.

Footer, legal, secondary notes

label 11px · Inter 500 tracking +0.01em · lh 1.4

Email address

Form labels, section labels

caption 10px · Inter 400 tracking 0 · lh 1.5

acme-engineering.threadcall.dev

Slugs, meta, timestamps

code 12px · DM Mono 400 tracking 0 · lh 1.55

const call = await thread.startCall()

Inline code, snippets

overline 10px · DM Mono 500 tracking +0.1em · uppercase

Open source · Built in Go

Eyebrows, badges, tags

Weights — DM Sans

Thread\
Call

font-weight: 300

Light — display sizes only (≥28px)

Thread\
Call

font-weight: 400

Regular — h1, h2, body headings

Thread\
Call

font-weight: 500

Medium — h3, h4, UI labels, CTAs

Text color roles

text-heading

#F5F0E8

All headings, titles, active nav links

text-body

#7A7890

Body copy, descriptions, nav links

text-label

#B8B5C5

Form labels, secondary metadata

text-muted

#4A4860

Placeholders, fine print, hints

text-amber

#E8A838

Overlines, tags, brand accent, active CTA

text-error

#E05555

Validation errors, destructive actions

Font + color pairings

| Variant | Font | Size / Weight | Color token | Where used |
| --- | --- | --- | --- | --- |
| display | DM Sans | 48px · 300 | #F5F0E8 | Landing hero only |
| h1 | DM Sans | 32px · 400 | #F5F0E8 | Page headings, auth welcome |
| h2 | DM Sans | 22px · 400 | #F5F0E8 | Card headers, workspace title |
| h3 | DM Sans | 16px · 500 | #F5F0E8 | Workspace names, card titles |
| body-lg | Inter | 15px · 400 | #7A7890 | Hero sub, landing descriptions |
| body | Inter | 13px · 400 | #7A7890 | Card descriptions, workspace sub |
| label | Inter | 11px · 500 | #B8B5C5 | Form labels, section labels |
| overline | DM Mono | 10px · 500 | #E8A838 | Eyebrows, badges, nav tags |
| caption | Inter | 10px · 400 | #4A4860 | Workspace slugs, timestamps, legal |
| error | Inter | 10px · 400 | #E05555 | Form validation, error alerts |

Badges & chips

All badge text uses DM Mono 500 · 10px · uppercase · tracking +0.1em

Open source · Built in Go Early access workspace v0.4.1 Error Draft

Live UI specimens

Landing — hero section

Open source · Built in Go

Conversations that\
*remember themselves*

Start a call from any message thread. When it ends, AI posts the decisions and action items back — automatically, to the exact conversation that needed them.

Auth — login card

ThreadCall — sign in

Email Password

Invalid email or password

Workspace — selector card

ThreadCall — workspaces

Welcome back, samir

Choose a workspace to get started.

Your workspaces

Acme Engineering

acme-eng.threadcall.dev

Navigation bar

ThreadCall

Home Features Docs GitHub

Logo: DM Sans 500 · 20px · tracking −0.02em | Nav links: Inter 400 · 12px · #7A7890 | Active link: Inter 400 · 12px · #F5F0E8 | CTA: Inter 600 · 11px · bg #E8A838

Rules

Do

- ✓Use DM Sans for all headings and the logo
- ✓Use Inter for all body, labels, and form text
- ✓Use DM Mono only for overlines, tags, and code
- ✓Use light weight (300) at display sizes ≥ 28px
- ✓Pair amber (#E8A838) with DM Mono overlines only
- ✓Use sentence case everywhere

Don't

- ✗Set `font-mono` as the page base font (workspace bug)
- ✗Use #9A98A6 or #6F6D78 — always use #7A7890
- ✗Use font-weight 600 or 700 — max is 500
- ✗Use light weight (300) at sizes below 28px
- ✗Use ALL CAPS for body or label text
- ✗Mix amber color into body text or descriptions

ThreadCall Design System · Typography v1.0 · threadcall.dev