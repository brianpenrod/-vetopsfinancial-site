# VetOps Studio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build the Studio portfolio, a company homepage, and accessible shared navigation, with Founders Release in development and pricing to be announced.

**Architecture:** Extend the existing static website. Native HTML serves content and links; a focused shared stylesheet and small progressive enhancement script supply responsive navigation and video controls. Preserve the MarginCommand product content and existing destinations.

**Tech Stack:** HTML, CSS, JavaScript, the existing Node preview server, Python unittest.

**Spec:** docs/superpowers/specs/2026-09-28-vetops-studio-design.md

## Global Constraints

- Use existing Cloudflare/GitHub project; prepare a preview without changing the production branch.
- Canonical routes: /, /studio, /margincommand, /founderrelease.
- Studio contact: studio@vetopsfinancial.com.
- FRR wording: In development — pricing to be announced. No legacy prices, delivery promises, or unsupported commercial service availability.
- Preserve original video files; create web derivatives in assets/studio. Keep each entire product visible.
- All navigation remains useful without JavaScript; reduced-motion disables automatic playback.

## Review Focus

- Mobile navigation: closed items cannot receive focus; Escape restores focus to the menu button.
- Media preference: reduced motion prevents autoplay but manual playback remains usable.
- Media failures: poster, native controls and source links still convey a useful project.
- Existing URLs: direct product and legacy .html links, beta login and pilot application remain valid.
- Content truthfulness: no invented client outcomes, FRR paid offers, or unsupported production readiness claims.

### Task 1: Studio portfolio and media

**Files:** Create studio.html, assets/css/company.css, assets/js/studio.js, assets/studio/*; update tests/test_public_consistency.py with Studio-specific checks.
**Interfaces:** Consumes the supplied four MP4s and existing brand fonts/favicon. Produces /studio, shared .company-nav markup, .site-shell theme, data-video-panel and data-video-toggle behavior.

- [x] Update checks for Studio media sources, dimensions, manual playback links, and studio email. Run the focused checks; expect failure because studio.html does not exist.
- [x] Create web video derivatives and posters. Implement the approved six-section Studio page and native playback with optional silent hero preview.
- [x] Run focused Studio checks; expect all pass. Commit task.

### Task 2: Company structure and restored FRR

**Files:** Modify index.html, founderrelease.html, margincommand.html, margincommand_pilot_links_live.html, assets/css/company.css, assets/js/site.js, tests/test_public_consistency.py; add sitemap.xml and robots.txt.
**Interfaces:** Consumes .company-nav and .site-shell. Produces the four-page shared navigation and FRR public development page.

- [x] Replace obsolete campaign-specific test expectations with navigation, balanced homepage, FRR status and no-price checks. Run tests; expect failures on the old homepage and FRR copy.
- [x] Implement the company homepage and development-status FRR page; add shared navigation to both MarginCommand surfaces without changing their product content.
- [x] Keep former homepage deep-link targets useful and retain original product destinations. Update canonical and search metadata.
- [x] Run python3 -m unittest discover -s tests -v; expect a green suite. Commit task.

### Task 3: Browser verification and reviewable handoff

**Files:** Add a concise build log and deployment/readme notes; fix only concrete issues found in QA.
**Interfaces:** Consumes all pages and native preview server. Produces a reviewed branch and preview/package for Brian.

- [x] Start npm run dev. Check all routes on desktop, tablet, and phone widths, including menu, reduced-motion, posters, actual video playback and contact destinations.
- [x] Capture browser screenshots and compare with the visual reference. Fix overflow, unreadable text, missing assets, or broken interactions.
- [x] Run full Python checks and JavaScript syntax checks. Expect no failures.
- [x] Obtain one fresh whole-branch review, address material findings, and commit verified changes.
- [x] Deliver an accessible preview and branch/package with production publication left for Brian to review.
