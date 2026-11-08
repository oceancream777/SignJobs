## 0.9.2 verification

- Removed the fabric asset/import, image-loader configuration and fabric credit from the active build. New theme uses CSS gradients and glass highlights only.
- All 142 unit tests passed, with TypeScript and passive-source checks. Distribution rebuilt at 0.9.2; final stylesheet checks passed after the color/highlight refinement.
- Isolated Brave test passed in light and dark themes: actual computed gradients contain at least three stops and no texture URL; the inner surface is translucent and backdrop filtering is active. Foreground contrast checks conservatively composite gradient stops, highlight, tinted surface and control backgrounds over both black and white underlays; tested text combinations reach at least 4.5:1.
- Existing extraction, clipboard, closure, company/role, wrapping, post-boundary, scroll and resize behavior passed. Screenshots: `artifacts/glass-0.9.2-light.png`, `artifacts/glass-0.9.2-dark.png`; single-card previews: `artifacts/glass-card-0.9.2-light.png`, `artifacts/glass-card-0.9.2-dark.png`.
- No real-model benchmark or new live LinkedIn DOM validation was performed. Static CSS blur is not a measured memory/performance guarantee.

## 0.9.1 verification

- TypeScript, passive-source checks and all 142 unit tests passed. Distribution rebuilt at 0.9.1.
- Isolated Brave regression passed with both color schemes: the data-URI texture loads at its original 102×78 size, inner reading panels are opaque, and tested visible text colors/background pairs meet at least 4.5:1 contrast. Existing company/role, wrapping, post-boundary, scroll, Apply-link, email-copy and closure checks passed.
- Screenshots: `artifacts/fabric-0.9.1-light.png` and `artifacts/fabric-0.9.1-dark.png`.
- Asset: Cloth Alike by Peax Webdesign, from atlemo/SubtlePatterns commit bf8adf755f512b23e7ed58fad1cccf14f3413eb7; 2,322 bytes; PNG unchanged. Attribution/license links are retained in source assets, built assets, third-party notices and Settings.
- No runtime texture fetch or new extension permission was introduced. No new live LinkedIn compatibility or real-model inference benchmark was performed.

## 0.9.0 verification

- TypeScript, passive-source checks and all 142 unit tests passed; distribution rebuilt at 0.9.0.
- Screenshot-derived Reelo/PUMA regressions verify company headers, actual role titles, multi-role headlines, full inspected context after a banner-only preview, explicit field precedence, paraphrased duty lists, stated location/stipend, no invented pay and model echo/vague-answer rejection.
- Isolated Brave test passed: headings visibly become Reelo and PUMA, role names appear separately, location/pay are in the overview, notes widen to 440 px with space available, and description text wraps without ellipsis or horizontal overflow. Prior loading, Apply, email clipboard, closure, scroll, native expansion and resize checks also passed.
- Screenshot: `artifacts/orientation-0.9.0.png`. These checks use synthetic post layouts; live LinkedIn markup is not newly verified. Real Qwen inference/quality remains unbenchmarked and needs a verified model download plus Auto mode.
- Two short phrases now replace the old two-visual-line restriction so readable text can wrap. Short post boundaries retain vertical scrolling rather than dropping note content.

## 0.8.2 verification

- Typography-only release: local Avenir/rounded font stack, lighter headings, more readable sizes and spacing across notes, details, Settings and saved items. No external font requests or new dependencies.
- TypeScript, passive-source checks, all 133 unit tests and the isolated Brave orientation check passed. The two-line explanation and post-boundary alignment remain intact; existing Apply/email/closure interactions passed.
- Screenshot: `artifacts/orientation-0.8.2.png`. Distribution rebuilt at 0.8.2.

## 0.8.1 verification

- TypeScript, passive-source checks, and all 133 unit tests passed; distribution rebuilt at 0.8.1.
- New regressions cover title-only Product Intern/Analyst, Business Analytics, Founder’s Office, Merchandise, AI Builder, Consumer Research and Operations roles; generic internship tasks without an invented function; reverse title order; invitation-based context excluding poster biography; refusal of a less useful model answer; and preservation of concrete duties mentioning product opportunities.
- Isolated Brave fixture now contains a Product Intern post with only recruiting fluff. Its compact note correctly displays the title-derived practical-task interpretation within the existing two-line layout. Loading, link extraction, clipboard copying, closure, scrolling, native expansion and resize checks passed. Screenshot: `artifacts/orientation-0.8.1.png`.
- This update uses the existing model revision; it does not require replacement weights. Rules-mode inference is verified; real Qwen generation and on-device performance remain unbenchmarked, as documented for 0.8.0.

## 0.8.0 verification

- TypeScript, passive-source checks and 120 unit tests passed; distribution rebuilt at 0.8.0.
- New tests cover fruit-sorter task inference without invented workplace, marketing-fluff removal, stated-duty priority, honest handling of vague roles, paraphrasing with exact evidence, rejected unsupported numbers/workplaces, strict short-line schema and preservation of links/emails/closure through enrichment.
- Isolated Brave orientation check passed, including exactly two visual lines per explanation and existing loading, Apply links, copy email, closed-role actions, native expansion, repeated scroll and resize behavior. Screenshot: `artifacts/orientation-0.8.0.png`.
- Qwen3 runtime support confirmed in installed Transformers.js 3.8.1 source. Browser-compatible export revision `3231b522c6e703b2f9b3cd8ea27426a1289a02f2` pinned with SHA256 hashes. Only small configuration metadata was fetched; tokenizer and weight file hashes/sizes came from repository metadata. Weight delivery HEAD returned HTTP 200 at `us.aws.cdn.hf.co`; optional permission/CSP updated for that host.
- Qwen3-1.7B q4f16 weights (about 1.43 GB) have NOT been downloaded, executed or benchmarked on the M1. Download completion, inference latency, peak RAM, semantic quality, and automatic enrichment with real model output remain unverified. Unit tests validate schema/boundaries using sample outputs; they do not establish model accuracy.
- New models require a matching stored model revision before Auto mode can run. Existing 0.5B download readiness is not reused. Runtime is one WebGPU request at a time with a 90-second deadline and 60-second idle unload; unsupported WebGPU/shader-f16 keeps the local fallback.

## 0.7.0 verification

- TypeScript, passive-source checks and 111 unit tests passed; distribution rebuilt at 0.7.0.
- Email cases cover personal and corporate domains, `.in`/`.co.in`, plus tags, apostrophes, subdomains, international domain names, malformed syntax rejection, hidden text, mailto query stripping, explicit application intent and negative instructions. Emails are separate contacts, never rendered as destination hyperlinks.
- Closure cases cover explicit closure/filled/freeze statements, negation, future/conditional wording and reopening. Hidden author content is checked; comment content does not establish author closure status.
- Isolated Brave browser check passed: Copy email directly from a hidden post DOM destination writes the exact plus-tagged `.co.in` address to the clipboard. A subsequent Applications closed author update removes Apply links while retaining the post and note. Every rendered summary destination uses HTTP(S). Existing geometry, extraction, loading and resize checks passed too.
- Screenshot: `artifacts/orientation-0.7.0.png`. Live LinkedIn markup has not been verified.
- Email syntax checks do not establish mailbox ownership, existence or delivery. Clipboard failure exposes selectable text for manual copying.

## 0.6.0 verification

- All 76 unit tests passed, together with TypeScript and passive-source checks. Distribution rebuilt at 0.6.0.
- Added whole-post link regressions: hidden sibling outside commentary, aria-hidden text URL, button data-href without executing onclick, full-text template, label URL, no adjacent-post/sidebar/state leakage, preserved comment provenance, application ranking, missing versus unexpanded content, unchanged DOM, bounded inspection with incomplete status.
- Isolated Brave browser check passed with a hidden application link outside the selected commentary container. Changing only its href updates the exact Apply destination automatically. Existing compact-layout, loading, native-job-link, author, ad, repeated-scroll, expansion and resize checks also passed.
- Screenshot: `artifacts/orientation-0.6.0.png`.
- These are synthetic browser fixtures, not a validation of the user's live LinkedIn session. Destinations absent from the DOM remain unavailable until the user expands/loads the relevant content.

## 0.5.0 verification

- TypeScript, passive-source checks, and all 66 unit tests passed; `dist` rebuilt at version 0.5.0.
- Isolated Brave synthetic layout passed: no toolbar, no changes to native post text/heights, direct Apply links from CSS-clamped text and native LinkedIn job cards, modern profile-link author recovery, explicit ad exclusion.
- Repeated scrolling preserves document positions and summary contents exactly; notes stay eight pixels below each post top, to its right and inside its bottom boundary. Native expansion and browser resizing preserve alignment.
- Pending indicators mount before classifier responses. Compact view excludes author-error placeholders and link-position labels.
- Current screenshot: `artifacts/orientation-0.5.0.png`. Browser test: `npm run test:browser`.
- Real LinkedIn markup remains unverified. Text absent from the DOM requires manual expansion; no automatic clicks or hidden API fetches were introduced.

## 0.4.0 verification

- TypeScript and passive-source checks passed; distribution rebuilt.
- 62 unit checks passed, including shared hiring vocabulary and explicit ad exclusion without suppressing visa sponsorship.
- Isolated Brave orientation test passed: text-based discovery without LinkedIn card selectors, unchanged post text/heights, notes outside posts and within vertical bounds, DM summary, rescan, filters preserving all posts, scrolling and resizing. Three notes for three organic posts; a fourth promoted post is excluded.
- Screenshot: `artifacts/orientation-0.4.0.png` (generated locally, ignored by Git).
- `npm run test:browser` runs the current orientation suite. `tests/browser.mjs` remains the historical collapse-era fixture and is superseded.
- No live LinkedIn account validation. Explicit labels are needed to reliably distinguish ads; narrow viewports hide side notes to preserve the original post layout.

# Validation record — 3 November 2026

This is a development build for loading unpacked in Brave, not a claim of completed live LinkedIn validation.

- TypeScript checks and passive-source/model-pin checks pass.
- 47 unit/DOM tests pass, including explicit/negated cues, body versus comments precedence, full DOM text versus absent text, safe links, redirects, import sanitization and model-output grounding.
- 500 synthetic posts complete the pure rules stress test. This is not a human-labelled accuracy benchmark or a whole-browser memory measurement.
- Packaged extension tested in a separate temporary Brave profile. The browser profile is closed and removed after the test; no personal browser account is used.
- Browser tests use synthetic HTML fulfilled locally for a LinkedIn-shaped URL. No real LinkedIn post corpus was downloaded.

Browser engine: `155.0.8059.80`. Initial 50-post tagging, including navigation: **424 ms** in this single run. A late post brings coverage to 51.

Passed browser scenarios:

- 50 rendered posts tagged
- comments cue
- DM cue
- link + DM
- negation
- unloaded full text
- CSS-clamped link
- event isolation
- saved data minimization
- late post
- recycled card host recovery
- kill switch restore
- SPA scope teardown
- SPA reactivation
- settings
- saved popup
- offscreen host availability
- no extension network

The recorded external request is the test page navigation, intercepted and served by the fixture harness. Rules mode emitted no extension-originated network requests. There were no browser page errors.

## Still unverified

- Live LinkedIn selector coverage and changes to actual DOM structure; real 300-post accuracy corpus.
- Default, Aggressive and disabled Brave Shields on a real signed-in session.
- Model download completion, cold/warm inference accuracy, latency, peak RAM and disk/cache behavior on the user's M1. Model weights were not downloaded without consent.
- Screen-reader pass, extensive zoom/viewport matrix, and the PRD's 20-minute live dogfood period.
- The <30 MB / 500-post whole-extension memory target. Shared constructed stylesheets reduce duplication, but this is not a measured RAM guarantee.

Event isolation is verified against normal bubbling page handlers. Existing ancestor capture-phase handlers run before an event reaches our Shadow DOM and cannot be retroactively prevented; this is not an anti-engagement or anti-detection guarantee.
