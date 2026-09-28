# VetOps Studio and Company Website Plan

Prepared for Brian Penrod · September 28, 2026

## Outcome

Give VetOps Financial one clear company homepage with three easily accessible destinations: VetOps Studio, MarginCommand, and Founders Release. Build the portfolio first, revise the homepage second, then finish navigation and restoration across the site.

The portfolio should help prospective clients see the quality of Brian's website, animation, and advertising work and start a conversation. The company homepage should explain the broader business. Each product page should explain its own purpose and current availability.

This document is the proposed design and build sequence. No website code, production settings, DNS, or email settings were changed while preparing it.

## What is ready

- Brand direction: **VetOps Studio**, a creative studio from VetOps Financial LLC.
- Service description: **Websites · 3D Product Animation · Brand Films**.
- Brian reports the new email is established and working. The plan uses the previously recommended **studio@vetopsfinancial.com**.
- Corrected watch film: 1920 × 1080, 24 fps, 10 seconds.
- Diamond ring film: 1920 × 1080, 24 fps, 10 seconds.
- Spartan plaque film: 1600 × 1600, 24 fps, 10 seconds.
- Bud Wiser's BBQ V3 film: 1920 × 1080, 30 fps, 25 seconds, with audio.
- Website examples identified: Gina Penrod's portfolio and the Carats & Timepieces preview. Their current destinations and presentation will be checked before adding them to the finished portfolio.
- The current website source is accessible in **brianpenrod/-vetopsfinancial-site**. It contains `index.html`, `margincommand.html`, `founderrelease.html`, an additional MarginCommand HTML page, shared assets, a local preview script, and Python consistency checks.

The four finished videos are sufficient to start. A new GPU render is not part of this plan.

## Site structure

| Page | Address | Main job | Main action |
| --- | --- | --- | --- |
| VetOps Financial | `/` | Introduce the company and its three offerings | Explore the offerings |
| VetOps Studio | `/studio` | Show finished creative work and explain the services | Start a project |
| MarginCommand | `/margincommand` | Explain job quoting, costs, margin review, and the controlled pilot | Request pilot access |
| Founders Release | `/founderrelease` | Explain the release-readiness project and its current development status | Contact Brian about the project |

Recommended navigation on all four pages:

**Home · VetOps Studio · MarginCommand · Founders Release · Contact**

The company logo returns to `/`. Each page highlights its current navigation item. Mobile visitors get the same destinations in a keyboard-accessible menu. Product-specific links such as Features, Pricing, or How It Works remain within the relevant page instead of crowding the shared navigation.

### Address decision

Use **vetopsfinancial.com/studio** for the first release. This fits Brian's request for an integrated company site and allows the portfolio to share the existing navigation and publishing workflow.

The previously suggested `studio.vetopsfinancial.com` is an alternative if the studio later needs its own independent site. A separate new domain would add another identity to maintain. Neither is needed for this build.

## Phase 1 — Build VetOps Studio

Create the studio page in the existing website project and prepare a reviewable preview.

### Visual direction

A cinematic, dark presentation with generous space, warm white type, and restrained gold accents connected to the existing VetOps identity. Let the real project footage provide the visual impact. Keep descriptions short and readable on a phone.

Proposed opening:

> **Your work deserves to be seen.**
>
> Custom websites, cinematic product animations, and brand films for businesses built on craftsmanship.
>
> **Explore the work** · **Start a project**

### Page sequence

1. **Opening showcase:** the corrected watch animation establishes the visual standard; provide pause/play controls and a static poster when motion is reduced or playback cannot start.
2. **Jewelry:** the watch and diamond ring, with a link to the Carats website preview after checking it.
3. **Bud Wiser's BBQ:** the finished V3 film and a short explanation of its use for a website and advertising.
4. **Custom craftsmanship:** the exploded Spartan plaque animation, showing material layers and assembly.
5. **Website work:** Gina's portfolio as a real website example, with an accurate preview and live link.
6. **Services and contact:** websites, product animations, and brand films; a concise introduction to Brian and an email-based Start a Project action.

Each featured project should identify the work created and its intended business use. Describe concept demonstrations accurately; do not invent paid-client status, testimonials, sales improvements, or other results.

### Video behavior

- Keep the uploaded master videos intact; create separate optimized web derivatives only where useful.
- Use poster images and load lower-page videos as visitors approach them.
- Avoid downloading or autoplaying all four films at once.
- Keep audio off until a visitor chooses to play it.
- Preserve each video's proportions, including the square plaque film; do not crop away products or text.
- Offer intentional replay for the plaque instead of treating its end-to-start transition as a seamless loop.
- Make reduced-motion and playback-failure states useful, with visible project information and manual playback links.

Completion: a working desktop and mobile studio preview with the four finished films, website examples, and the studio contact link.

## Phase 2 — Rework the VetOps Financial homepage

The current homepage's headline, primary actions, and prominent 2:43 video focus on MarginCommand. Reframe the opening around the company and give visitors a clear route to each offering.

Proposed homepage direction:

> **Practical software. Powerful digital experiences.**
>
> VetOps Financial develops business software and creates websites, product animations, and brand films. Founded by Brian Penrod in Fayetteville, North Carolina.

Suggested sequence:

1. Company introduction with a concise headline.
2. Three prominent offering panels: VetOps Studio, MarginCommand, and Founders Release. Each has its own description, current status, and destination.
3. A short selected-work preview linking to Studio.
4. Brian's founder introduction and relevant background.
5. Program membership information with accurate attribution.
6. Contact and the shared footer navigation.

The full MarginCommand workflow demo already appears on its product page. Remove its dominant homepage placement and link visitors to that existing demo from the MarginCommand panel. Keep the product's existing pilot, login, pricing, and application destinations working.

Update the homepage title, description, and sharing metadata to represent the whole company. The grant application and its outcome are internal context for this redesign, not proposed public homepage copy.

Completion: a company homepage that explains the three offerings clearly without requiring visitors to watch a product demo first.

## Phase 3 — Restore Founders Release and connect the pages

The source repository still contains `founderrelease.html`; it currently declares `noindex, nofollow`. The research tool could not retrieve its public URL, so the source finding does not establish whether the live route itself is broken. Verify the route during implementation.

Restoration includes:

- Review the existing page's older service claims, pricing, and turnaround promises against the project's current verified state.
- Present **Founders Release** consistently by name and describe its development status clearly.
- Use an inquiry action appropriate to that status rather than automatically retaining old purchase-oriented offers.
- Add the shared header and footer and verify the clean URL plus existing HTML links.
- Make the reviewed public page eligible for indexing when it is published; check both page metadata and any hosting-level rules.
- Include the four canonical pages in sitemap and page metadata as appropriate to the existing deployment.

The navigation work is designed from the start and completed across all pages here. It also covers the additional MarginCommand HTML page if that remains a supported public entry point.

Completion: every main destination is reachable directly from the shared navigation on desktop and mobile, and the Founders Release page accurately reflects the project.

## Source and verification work

Use the existing HTML/CSS/JavaScript project and current hosting workflow. Inspect the current branch and deployment configuration before edits; create an isolated working branch and preview.

The current `tests/test_public_consistency.py` intentionally enforces the old campaign design: a MarginCommand-only homepage, the prominent homepage demo, no Founders Release homepage link, and Founders Release marked noindex. Replace those specific expectations with checks for the requested company structure and restored visibility. Retain useful checks for truthful copy, product links, program attribution, and video delivery. Keep `tests/test_conversion_paths.py` protecting the existing MarginCommand login destination.

Check the actual customer journey: home → each offering → another offering or home → contact. Verify mobile menu operation, keyboard use, visible focus, video loading/playback, reduced motion, aspect ratios, direct page loads, and existing pilot/login links. Confirm shared styles do not damage the product pages.

Prepare the full preview and show Brian the result before publishing the coordinated production update. Keep the prior deployed version available for rollback. No new paid service is required by this design; confirm deployment details from the existing setup during implementation.

## Starting point

The next implementation step is the **VetOps Studio preview in the existing website project**. The finished media and source repository are available, so no additional creative assets or source ZIP are required to begin.

## Reviewed references

- [Current VetOps Financial homepage](https://vetopsfinancial.com/) — reviewed September 28, 2026.
- [Current MarginCommand page](https://vetopsfinancial.com/margincommand) — reviewed September 28, 2026.
- [Existing website source repository](https://github.com/brianpenrod/-vetopsfinancial-site) — default branch and relevant source files inspected read-only.
- [Founders Release source](https://github.com/brianpenrod/-vetopsfinancial-site/blob/main/founderrelease.html) — existing metadata and public copy inspected.
- [Current public consistency checks](https://github.com/brianpenrod/-vetopsfinancial-site/blob/main/tests/test_public_consistency.py) — campaign-specific expectations identified for the requested change.
- User-provided final videos and Brian's directions in this conversation.

## Approved clarification

Brian approved implementation on September 28, 2026. Founders Release is to show **In development — pricing to be announced**. Remove old prices, purchase-oriented offers, delivery promises, and unsupported current service claims.
