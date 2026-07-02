# CLAUDE.md

## Project

DMW Client Satisfaction Measurement (CSM) System — digitizes and administers the Anti-Red Tape Authority's mandatory Client Satisfaction Measurement survey (PSA Approval No. ARTA-2242-3) for the Department of Migrant Workers, Republic of the Philippines.

Current state: greenfield, no code yet. Two reference assets live in `images/`:
- `dmw-themeplate.png` — a page from the live DMW website (dmw.gov.ph). Establishes the brand to match: navy header/footer, light-blue service tiles, PH government seal, GOVPH utility bar, existing type rhythm.
- `CSM-Form.jpg` — the official paper CSM form. Fixed regulatory content: demographic fields (Age/Sex/Region/Agency/Service/Customer type), CC1-CC3 Citizen's Charter awareness questions, SQD1-8 five-point Likert satisfaction items (Responsiveness, Reliability, Access and Facilities, Communication, Costs, Integrity, Assurance, Outcome), a remarks field.

## What this system is

Two different UI problems in one app:
1. **Public survey form** — the digitized CSM form, filled out once per transaction by a broad public audience (OFWs, applicants, families; wide range of age, literacy, and device).
2. **Internal results view** — tabular/aggregate reporting for DMW staff (not yet scoped; when built, treat it as a dashboard, not a landing page).

## Design source of truth: `front-end-skill.md`

All UI work in this repo follows `front-end-skill.md` (project root). Read it before building any screen. How it applies here specifically:

**This is a trust-first / public-sector / regulated / accessibility-critical brief** (Section 0.A, 1.A). Do not use the skill's default baseline dials (`8/6/4`). Use the public-sector preset:
- `DESIGN_VARIANCE: 3-4` — predictable, symmetrical, no asymmetric risk-taking.
- `MOTION_INTENSITY: 2-3` — functional transitions only, no scroll choreography.
- `VISUAL_DENSITY: 4-5`.

Declare the Design Read (Section 0.B) before starting any new screen, e.g.: *"Reading this as: public-sector CSM survey for a general citizen audience, with a trust-first language, leaning toward the existing DMW brand system."*

**The skill is explicitly out of scope for the two hardest parts of this app** (Section 13):
- The survey form is a multi-field form, not a landing page. Follow Section 4.6 (label above input, helper text present, error below, no placeholder-as-label) and standard accessible form practice — not hero/bento/marquee patterns from the rest of the skill.
- Any results/reporting view is dense product UI. Use TanStack Table or AG Grid per Section 13, not landing-page card grids.
- Apply the skill's marketing-page rules (Sections 4, 9, 10) only to genuinely informational surfaces, if any exist.

**Brand is inherited, not invented.** This isn't a greenfield visual identity — treat it as Redesign Protocol Section 11, "Preserve": extract tokens from `images/dmw-themeplate.png` (navy, light-blue tiles, PH seal placement, GOVPH/ARTA utility bar, existing type rhythm) before choosing anything new. Don't apply Section 4.2's premium-consumer palette guidance or invent an unrelated accent color — match the department's existing color system.

**Official survey content is fixed, not copy to punch up.** The CC1-CC3 and SQD1-8 item text, the SD/D/NAD/A/SA 1-5 scale labels, and the ARTA approval number are regulatory content from `images/CSM-Form.jpg` and must be reproduced exactly. Section 9's "no filler verbs / cute copy" rules apply to UI chrome the project adds (headings, button labels, empty/error states) — not to the mandated survey questions.

**Accessibility is the actual product requirement here, not a checkbox.** Respondents span a wide age and literacy range, often on mobile. WCAG AA minimum everywhere (Sections 6.B, 8.B), full keyboard operability, honor `prefers-reduced-motion`. Keep the emoji-rating row from the paper form (😞🙁😐🙂😀) as an accessible enhancement alongside the numeric scale, not a replacement for it.

**Stack:** not yet chosen. Default to `front-end-skill.md` Section 3 (React/Next.js, Tailwind, one icon library) unless told otherwise — confirm before scaffolding.

`taste-skill.md` also lives in this repo. It isn't the governing skill here (front-end-skill.md is), but its restraint instinct — spend boldness in one place, keep the rest quiet — matches the trust-first tone above: this project should look considered, not experimental.
