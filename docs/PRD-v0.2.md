# Engineering PRD: Hiring Post Skimmer for Brave

A passive UI layer over LinkedIn content search for Brave desktop. Version 0.2, 3 Nov 2026. Status: draft for build.

## 1. Summary

LinkedIn hiring posts are built to be clicked, not read. Posters have learned that the feed preview cuts text after a few lines and shows a 'more' control, so they put the application link after the cutoff or in a self-written first comment. Every interested reader then has to click 'more' or open the comments, and each click counts as engagement that raises the post's reach. For a job seeker this is friction on every post: open it, expand it, scroll, open comments, hunt for a link.

This extension runs only in Brave, on the LinkedIn content-search results page, after the user has searched and applied LinkedIn's own filters. It collapses every rendered post into a compact row with a role-category tag and an outcome marker (link visible, link in comments, need to DM, or post continues). A hover arrow opens a summary of the role and the application link, read from what LinkedIn has already rendered, so the reader learns whether to apply, find the link in the comments, or DM the poster without performing the 'more' or comments click the layout was designed to extract. It is a display-layer fix only: it does not search, scroll, click, or fetch anything on the user's behalf. Processing and rendering run inside Brave by default, using only open-source models. An optional backend of our own exists for machines that cannot run the model, and it is off unless the user turns it on. A Safari and Xcode port is planned later and is out of scope for this version.

## 2. Goals and non-goals

**Goals**

- G1: Cut the time to judge a hiring post from about 20 seconds to under 3 seconds.
- G2: Tag every rendered post with a role category (for example Product Management, Business Analyst, Intern).
- G3: For every hiring post, tell the user from the visible text what to do next: use the apply link, find the link in the comments, DM the poster, or open the post because it continues.
- G4: Show the apply link itself whenever it is in the visible text, and, if the user opts in, fetch it from the full post or comments with a per-click peek.
- G5: Ship as one Manifest V3 extension for Brave desktop, loaded unpacked first, with no other browser targets in v1.
- G6: Do the thinking in the browser: all processing and rendering run inside Brave by default, with open-source models only.
- G7: If a backend is needed for weaker machines, keep it optional, thin, and free or near-free to run.
- G8: Keep the account-risk surface as small as possible.

**Non-goals**

- No auto-scrolling, auto-clicking, auto-expanding, or auto-pagination.
- No background scraping, crawling, or any request to LinkedIn servers made by the extension.
- No notifications or alerts (this tool only works while the user browses).
- No auto-apply, auto-DM, or auto-connect.
- No storing or republishing LinkedIn post text outside the user's device.
- No resume-fit scoring in v1 (planned as P2).
- No Safari, Xcode, Firefox, or mobile build in this version.
- No closed-source models and no paid third-party model APIs.
- No required server: the extension must be fully usable with no backend at all.
- Not an attempt to change how LinkedIn counts impressions or to hide anything from post authors. The extension only changes what the reader has to click.

## 3. Compliance posture (design rules)

LinkedIn's User Agreement prohibits third-party software that scrapes or modifies its site, and LinkedIn restricts accounts for it. There is no loophole, so this PRD lowers risk by design and does not claim to remove it. These rules are release-blocking.

- R1 Passive only: the extension reads DOM nodes the browser has already rendered because of the user's own actions.
- R2 No synthetic input: no `click()`, `scrollTo`, `dispatchEvent`, or form interaction on LinkedIn elements, ever.
- R3 No network calls to linkedin.com from extension code. No use of LinkedIn cookies, tokens, or internal APIs.
- R4 Scope: runs only on content-search result pages (`/search/results/content/`). It does nothing on the feed, profiles, messaging, or jobs.
- R5 Local-first: all processing runs inside Brave by default. No analytics, no telemetry, no remote config, and no remote code. The only network calls are a one-time model download from Hugging Face, and calls to our own backend, which stay off until the user opts in because they send post text off the device.
- R6 Data minimisation: post text is processed in memory and is not persisted. Only derived fields (tag, role title, extracted URLs) are held in a session cache, and the user's explicit saved items persist locally.
- R7 Human-speed behaviour: UI work is limited to rendered posts, throttled and idle-scheduled, with no bursts that look like automation.
- R8 Open models only: every model is open-weight under an OSI-approved licence (Apache 2.0 or MIT), published on Hugging Face, GitHub, or GitLab, and pinned to a commit hash.

One candidate exception to R2 and R3, the per-click comments peek, is described in section 6 as R3b. It is off by default and needs an explicit decision (open question 4).

## 4. User flow

1. The user opens LinkedIn content search and enters their query, for example `hiring` AND (`Product Management` OR `Business Analyst` OR `Intern`).
2. The user applies LinkedIn's own filters (date posted, from my network, and so on).
3. The extension detects the results page and injects a slim toolbar that reads 'Tagged 0 of N', where N is the number of posts rendered on the page.
4. For every one of the N posts, the extension embeds a category tag chip over the post within about a second: the role the post is hiring for, such as Product Management, Business Analyst, or Intern. Each post is collapsed to a compact row showing the chip, the author, and the bait marker.
5. As the user scrolls or paginates on their own, newly rendered posts get their chips the same way, and the toolbar count updates.
6. When the user hovers over a chip, a `→` button slides out beside it.
7. Clicking `→` opens a small popover anchored to the chip, with the role summary and the application link. The post is not opened and no comments are loaded.
8. The user clicks the apply link (a normal user click on a normal link), or `Open post` when the link is in the comments.

## 5. Functional requirements

Priority: P0 = v1 must-have, P1 = v1.1, P2 = later.

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Detect the content-search results page, including SPA route changes without a full reload. | P0 |
| FR-2 | Discover every post node currently in the DOM and any added later, without triggering loads. | P0 |
| FR-3 | Collapse each post to a compact row using CSS only, with no node removal. The user can toggle one post or all posts. | P0 |
| FR-4 | Embed one category tag chip over every post rendered on the page (all N posts, not a sample). Tags come from the user-editable taxonomy plus `Other` and `Not hiring`, and appear within 1 s of the page settling. | P0 |
| FR-5 | Hovering the tag chip reveals a `→` button beside it. The button also appears on keyboard focus. Clicking it is the only action that starts further processing. | P0 |
| FR-6 | The `→` opens a small popover anchored to the chip (not a new browser window) with role title, company, location, employment type, a two-line summary, where the link was found, and the extracted links. It does not open the post or load comments. | P0 |
| FR-7 | Extract apply links from all rendered post text, including text that is clamped behind 'more' but present in the DOM (read from the text container's full text content, never by expanding it), plus anchors. Decode LinkedIn redirect wrappers. | P0 |
| FR-8 | Bait marker on every row: `Link visible` (before the preview cutoff), `Link after cutoff`, `Link in comments`, or `No link found`. | P0 |
| FR-9 | When the post says the link is in the comments and comments are not rendered and the peek (FR-23) is off or failed, the popover shows a clear 'Link is in comments' state and an `Open post` link. | P0 |
| FR-10 | Rules-based processing (Tier 0) for every rendered post, with no model and no network. | P0 |
| FR-11 | On-demand model summary (Tier 1): when the user opens `→`, an on-device open-source model fills role, company, location, and a two-line summary. If it fails, the rules result is shown. | P0 |
| FR-12 | Model manager in the options page: shows model name, licence, size, and revision, asks consent before download, and has a delete button. | P0 |
| FR-13 | Processing-mode setting: `Rules only`, `Auto` (rules plus on-device model), `Backend` (opt-in), or `Local server` (advanced). | P1 |
| FR-14 | Toolbar with per-category and per-marker counts, click-to-filter chips (hide non-matching rows via CSS), and a collapse-all or expand-all control. | P1 |
| FR-15 | Keyboard navigation: `j` and `k` to move between rows, `Enter` for the popover, `o` to open the apply link. | P1 |
| FR-16 | Mark a post as Saved or Applied, stored locally, with a simple list view in the extension popup, plus Export and Import as JSON. | P1 |
| FR-17 | Read comments the user has already opened themselves and add any links found to the popover. | P1 |
| FR-18 | Optional backend client (Tier 2) for browsers that cannot run the model, off by default. | P1 |
| FR-19 | Local resume-fit score and ranking from the user's pasted resume. | P2 |
| FR-20 | Tag coverage: the toolbar shows 'Tagged X of N'. A chip shows a loading state until its tag is ready, and a failed post shows `Untagged` with a retry on hover. Posts that render later are tagged as they appear. | P0 |
| FR-21 | Popover behaviour: opens within 150 ms with Tier 0 results and fills in the model summary when ready. It flips to stay inside the viewport, closes on `Esc`, an outside click, or when its card scrolls out of view, and returns focus to the chip. Only one popover is open at a time. | P0 |
| FR-22 | Event isolation: clicks and hovers on our chip, arrow, and popover never reach LinkedIn's own handlers, so they cannot open the post. | P0 |
| FR-23 | Per-click comments peek (opt-in, default off): when the user clicks the arrow on a post marked 'Link in comments', the extension loads that one post's comments itself, extracts the links, and shows them in the popover, so the user never opens the comments. One request at a time, no prefetch, a cap of a few per minute, and an immediate stop at the first sign of throttling. Needs the R3b exception. | P1 |
| FR-24 | Extract experience and seniority (for example '0-1 years', 'fresher', 'senior') and show it in the popover. | P1 |

## 6. Critical constraint: the preview cutoff and what is in the DOM

Finding from use: the feed and search cards do not carry the full post text. Long posts are cut at the source, so a link placed after the cutoff is not on the page until the post is opened. The requirement is still to tell the user what to do without opening the post or its comments, so this section separates what the summariser can say from visible text alone from what needs a request.

**What the summariser does with visible text (no request).** It reads only the text LinkedIn shows, writes the role summary, and adds one outcome:

| The visible text says | The popover shows |
| --- | --- |
| An apply link or email address | Role summary + the apply link |
| The link is in the comments (an explicit phrase, and no link in the text) | Role summary + Link in comments |
| To DM the poster (an explicit phrase such as 'DM me' or 'DM') | Role summary + Need to DM |
| None of the above, and the text is cut off at 'more' | Role summary + 'Post continues, link not in the visible text', with the peek or `Open post` |

The labels are used only when the author says so explicitly. The summariser never guesses that a link is in the comments or that a DM is needed. If a post contains a link and also asks for a DM, both are shown, with the link as the primary action. Cue phrases, whole-word matching, and negation handling (for example 'please don't DM') are specified in section 8.

**Beyond the visible text (needs a request).** Text after the cutoff and the comments are not on the page until something loads them, so no passive method reaches them. To give the user a link that sits there, the extension has to load the post itself. The options:

- **Option 1, passive only:** the outcome table above. Lowest risk. It tells the user which posts are worth a click, but a link placed after the cutoff or in the comments stays unreachable.
- **Option 2, per-click post peek (opt-in, FR-23):** when the user clicks → on a post whose outcome is 'Post continues' or 'Link in comments', the extension loads that one post (full text and comments), runs the summariser on the full text, and shows the link. One request at a time, no prefetch, a cap of a few per minute, an immediate stop at the first throttle, captcha, or checkpoint, and results cached. This meets the requirement, but it is an extension-made request to LinkedIn, so it breaks R2 and R3 and needs a named exception (R3b). It is off by default.
- **Rejected, background prefetch of full posts or comments for every post:** this is bot-like volume and the most likely trigger for an account restriction.

Recommendation: build the passive outcomes first. They handle the 'link in comments' and 'DM me' cases with no request and no added risk, and they tell the user which posts deserve a click. Add Option 2 behind a setting that is off by default, and test it on a throwaway account in M0 before anyone uses it on a main account. Because long posts are cut at the source, Option 2 is the only way to reach a link placed after the cutoff. Even per click, it is the riskiest feature in this PRD, because LinkedIn's terms prohibit software that makes its own requests to the site.

## 7. Architecture

**Stack**

- WebExtension, Manifest V3, TypeScript, built with Vite or WXT as a single Chromium package.
- Target: Brave desktop (current stable) on macOS and Windows. For v1 it is loaded through `brave://extensions` with Developer mode on and Load unpacked. A Chrome Web Store listing (installable in Brave) is optional later.
- UI: injected components in a Shadow DOM root, so LinkedIn's CSS cannot break the extension and ours cannot leak. The summary panel is an in-page drawer. It does not depend on `chrome.sidePanel`, whose behaviour in Brave is checked in M0 first.
- Code is written against standard WebExtension APIs behind a thin wrapper (`webextension-polyfill`), so the later Safari and Xcode port needs no rewrite.

**Components**

- Content script: route detector, post observer, DOM adapter, collapse engine, and UI injector. All rendering happens here, inside a Shadow DOM.
- DOM adapter: the only module that knows LinkedIn's markup. It exposes `getPostId()`, `getAuthor()`, `getRenderedText()`, `getAnchors()`, `getCommentsIfRendered()`, and `getCardRoot()`.
- Rules worker (Tier 0): pure functions for the hiring gate, classifier, link extractor, and bait marker, in a Web Worker so it never blocks the page.
- Offscreen document (Tier 1): hosts the on-device model with Transformers.js and ONNX Runtime Web. It is the only place model weights are loaded.
- Background service worker: settings storage and message routing between the content script and the offscreen document. It is also the only code allowed to call Hugging Face (model download) or our backend (Tier 2).
- Popup and options page: taxonomy editor, processing mode, model manager, and the saved list.

**Permissions (minimum)**

- Host permission for the page: `https://www.linkedin.com/search/results/content/*`.
- `storage` and `offscreen`. No `tabs`, `cookies`, `webRequest`, or `<all_urls>`.
- Optional host permissions, requested only when the user opts in: `https://huggingface.co/*` plus its file-hosting domains (listed after M0) for the model download, and our backend's origin for Tier 2.
- Extension-page CSP adds `wasm-unsafe-eval` so ONNX Runtime Web can run WebAssembly. No remote scripts, and the runtime's WASM files are bundled in the package, not loaded from a CDN.

**Brave specifics**

- Shields: test with default Shields, with Aggressive blocking, and with Shields off on linkedin.com. The extension must not depend on any script or request that Shields could block, and must show a toolbar warning if post nodes never appear.
- Storage: use `storage.local` only. Brave does not sync extension data through Google, so the options page offers Export and Import as JSON for settings and the Saved list.
- No built-in AI dependency: do not assume browser AI APIs exist in Brave. Rule-based extraction ships in v1.
- Updates: an unpacked build does not auto-update, so the options page shows the build version, with a reminder to reload the extension at `brave://extensions` after pulling a new build.
- Permission prompt: the manifest declares only the content-search host, so Brave shows a narrow host-permission warning.

**Post discovery**

- A `MutationObserver` on the results container finds newly added post nodes. An `IntersectionObserver` prioritises on-screen posts, and the rest are processed in `requestIdleCallback` batches so work looks like normal page behaviour.
- Posts are keyed by their activity URN (`urn:li:activity:...`) when present, otherwise by a hash of author plus the first 200 characters.
- The observer never scrolls. A counter in the toolbar shows how many posts have been tagged so far, for example '37 tagged'. Posts the user has not scrolled to (and LinkedIn has not rendered) cannot be processed, which is an accepted consequence of R2.

**Selector resilience**

LinkedIn changes class names often. The DOM adapter must prefer stable hooks in this order: `data-*` attributes and URNs, ARIA roles and labels, structural position, and only then class names. The selector set lives in one versioned file shipped inside the extension (no remote updates, per R5). A health check logs locally and shows a toolbar warning ('Layout changed, tagging paused') if the adapter cannot find post nodes on a page that clearly has results. Failure mode is always 'do nothing and leave LinkedIn untouched', never a broken page.

## 8. Extraction and classification

**Pipeline per post**

1. Read the visible text and anchors through the DOM adapter, and note whether the text is cut off (a 'more' control is present).
2. Hiring gate: score for hiring intent ('we are hiring', 'hiring', 'looking for', 'opening', 'join our team', 'apply'). Below the threshold the row is tagged `Not hiring`.
3. Category: rule-based match against the taxonomy (title and synonym lists, weighted by position in the text and by hashtags). Ties go to the earliest mention in a title-like phrase.
4. Role title: pattern extraction (for example 'looking for a X', 'hiring a X', 'role: X', 'position: X', or a line containing a taxonomy keyword plus seniority words). Fallback to the category name.
5. Company, location, type, experience: author headline or company line, 'location:' patterns, 'experience:' patterns (for example '0-1 years'), and keywords such as 'intern', 'remote', 'hybrid', 'full-time'.
6. Links: regex plus anchor `href` collection, with redirect decoding and type labelling.
7. Cue detection: explicit 'link in comments' phrases and explicit DM phrases, with negation handling.
8. Outcome marker: `Link visible`, `Link in comments` (no link in the text and the author says so), `Need to DM`, `Post continues` (text cut off and nothing found), or `No link found`.
9. Output a `PostSummary` object, cached in memory by post id.

**Default taxonomy (editable)**

| Tag | Example match terms |
| --- | --- |
| Product Management | product manager, APM, associate product manager, PM, product owner |
| Business Analyst | business analyst, BA, data analyst (optional), systems analyst |
| Intern | intern, internship, trainee, summer analyst |
| Other | any other hiring post |
| Not hiring | hiring gate failed |

A post that matches both a role and Intern gets the role tag plus an `Intern` badge. Role and seniority terms can be case-insensitive and are matched on word boundaries to avoid false hits (for example 'PM' versus 'pm' as a time).

**Link handling**

- Decode `linkedin.com/safety/go?url=...` wrappers into the real target for display, while the click still goes through the original href.
- Keep `lnkd.in` short links as they are (they cannot be expanded without a network call).
- Label by host: Google Forms, Lever, Greenhouse, Workday, Ashby, company careers page, `mailto:` (email application), or 'Other'.
- Strip tracking parameters only in the label shown, never in the actual link.
- Rank apply links above 'read more' and social links, and show at most three.

**Cue phrases (editable, English first)**

- Link in comments: 'link in comments', 'link in the comments', 'apply link in comments', 'details in the comments', 'check the comments', 'link in the first comment', 'link below'.
- Need to DM: 'DM me', 'DM us', 'DM', 'send a DM', 'drop a DM', 'message me', 'inbox me', 'ping me', 'reach out to me on LinkedIn'.
- Matching: case-insensitive and whole-word, so 'DM' does not match inside 'admin'.
- Negation: phrases such as 'please don't DM', 'no DMs', and 'do not message' suppress the Need to DM label.
- Precedence: a link found in the text wins as the primary action. A cue is shown only when no link covers it, except that a DM cue is always added as a note.

**Model strategy: open-source models only, processing in the browser first**

Every model must be open-weight under an OSI-approved licence (Apache 2.0 or MIT), published on Hugging Face, GitHub, or GitLab, and pinned to a commit hash (rule R8). Models run in tiers, and each tier is used only when the one above it is not enough or not available.

| Tier | Where it runs | What it does | When it runs | Default |
| --- | --- | --- | --- | --- |
| T0 Rules | Rules worker in the page | Hiring gate, category, links, bait marker | Every rendered post | On |
| T1 On-device model | Offscreen document in Brave (WebGPU, WASM fallback) | Role, company, location, and a two-line summary | Only when the user opens `→`, or when T0 confidence is low | On, after the user approves the download |
| T2 Our backend | Our API, serving the same open models | Same output as T1, for machines that cannot run T1 | Only when T1 is unavailable and the user has opted in | Off |
| T3 Local server | The user's own machine (Ollama or llama.cpp on 127.0.0.1) | Same output with a larger model | Same triggers as T2 | Off, advanced |

The model is never run on every post. T0 handles the whole page cheaply, and the model runs on one post at a time when the user asks for a summary. This keeps memory, battery, and backend cost low.

**Model shortlist (confirm each licence and ONNX build on the model card in M0)**

| Job | Candidate | Notes |
| --- | --- | --- |
| Category fallback (embeddings) | bge-small-en-v1.5 (MIT) or all-MiniLM-L6-v2 (Apache 2.0), int8 ONNX | Tens of MB, small enough to bundle in the extension. |
| Role, company, location, summary | Gemma 4 E2B instruction-tuned, ONNX, q4f16 (Apache 2.0) | Primary candidate. Gemma 4 moved to Apache 2.0 in April 2026, and a published Chrome extension already runs it through Transformers.js and WebGPU. Community builds report roughly a 0.5 GB download. |
| Smaller fallback | Qwen3 0.6B to 1.7B instruct (Apache 2.0), ONNX build | For machines where the primary is too heavy. Confirm an ONNX build exists. |
| Entity tagging (optional) | GLiNER (Apache 2.0) | Zero-shot role, company, and location tagging. The ONNX and JS port needs checking. |

**Tier 1 runtime (inside Brave)**

- Host: an MV3 offscreen document holds the model and the service worker routes messages to it. Content scripts never touch the model. Whether `chrome.offscreen` and its worker support behave in Brave is checked in M0.
- Library: Transformers.js (`@huggingface/transformers`) on ONNX Runtime Web. WebGPU first, WASM fallback.
- Device choice: Brave 1.93 (August 2026) blanks WebGPU adapter details as fingerprint protection but does not turn WebGPU off. So the code never branches on adapter vendor. It tries a tiny warm-up inference on WebGPU and drops to WASM if that fails.
- Quantisation: start with q4f16 for the language model. Also test q8 and fp16, because Transformers.js issues report decoder problems for some q8 builds on WebGPU.
- Download: first run shows model name, licence, size, and pinned revision, then downloads from Hugging Face with SHA-256 checks and caches it in the browser. The options page has a delete button.
- Prompting: the input is only the rendered post text, capped at about 1,500 characters. The output must match a JSON schema. Invalid output is discarded and the T0 result is shown.
- Rendering: model output is plain data. The content script renders it with safe DOM APIs inside the Shadow DOM.

**Backend API (Tier 2, optional)**

- One endpoint, `POST /v1/extract`, taking a batch of up to 5 items, each with the rendered post text, clamp offset, and a language hint. It returns the `PostSummary` fields the model fills.
- It is called only from the background service worker, never from the content script. The CI lint allow-list names that one module.
- Auth: a random install token generated locally. No account and no identity. Per-token rate limits, HTTPS only, and CORS limited to the extension's origin.
- The server stores nothing: no post text in logs or disk, only request counters.
- Opt-in text states plainly that rendered post text is sent to our server. This path adds ToS exposure compared with on-device processing, so it stays off by default.
- Serving: the same pinned open models behind llama.cpp, Ollama, or vLLM. A thin gateway in front handles auth and rate limits.

**Free or near-free hosting if we need a backend (as of 3 Nov 2026, figures from search results, re-check before committing)**

| Option | Cost | What it gives | Catch |
| --- | --- | --- | --- |
| Cloudflare Worker plus Workers AI | Free up to 10,000 neurons per day, then $0.011 per 1,000 neurons | Hosted open-source models and a free gateway for auth and rate limiting, with no server to run | The model catalogue is Cloudflare's, so we cannot pin our own revision. The free allocation is shared across models and resets at 00:00 UTC. Check per-model neuron rates in M0. |
| Oracle Cloud Always Free (Ampere A1) | $0 | An always-on ARM VM that can run llama.cpp with a small quantised model | Reported cut in June 2026 from 4 OCPUs and 24 GB to 2 OCPUs and 12 GB. CPU only, so larger models will be slow, and capacity can be hard to get. |
| Local server on the user's machine | $0 | Full privacy, and any open model the machine can run | Needs setup per user. The server must allow the extension's origin in its CORS settings. |
| Hugging Face Spaces (CPU Basic) | Hardware is free (2 vCPU, 16 GB RAM) | An easy home for a small FastAPI and llama.cpp server | Creating Docker Spaces now needs a paid Hugging Face plan, and free Spaces sleep after 48 hours idle. |

**Recommendation:** ship T0 and T1 only, which costs nothing and needs no server. If M0 shows that too many machines cannot run T1, add T2 as a Cloudflare Worker in front of Workers AI. Move to an Oracle ARM VM only if we need to pin and serve our own model.

## 9. Data model

```
PostSummary {
  postId: string            // activity URN or content hash
  category: string          // taxonomy tag
  badges: string[]          // e.g. ['Intern', 'Remote']
  roleTitle: string | null
  company: string | null
  location: string | null
  employmentType: string | null, experience: string | null
  links: { url, display, kind, source: 'body'|'anchor'|'comment' }[]
  linkInComments: boolean, baitMarker: 'visible' | 'in-comments' | 'dm' | 'continues' | 'none', source: 'rules' | 'on-device' | 'backend', modelRevision: string | null
  textTruncated: boolean
  confidence: number        // 0..1
}
```

- Session cache: `Map<postId, PostSummary>` in memory, dropped on tab close.
- Persisted (`storage.local`): user settings, taxonomy, and Saved or Applied items containing only postId, role title, company, the apply link, status, and timestamp. Post body text is never persisted.

## 10. UI specification

**Tag chip** (the main element, embedded on every post): a small rounded chip, colour-coded by category, showing the role the post is hiring for (for example Product Management), with an `Intern` badge where relevant. It lives in a host element inserted as the first child of the post card, so it never covers LinkedIn's own controls. In collapsed mode it is part of the row. In expanded mode it floats over the card's top-right corner. Chip states: loading (grey skeleton), tagged, `Other`, `Not hiring` (dimmed), and `Untagged` (error, with a retry on hover).

**Collapsed row** (height about 48 px): the tag chip, the role title (or 'Role not detected'), the author name, and a small bait marker (link visible, after the cutoff, or in the comments). A click on the row body toggles the original card open for the user's normal reading.

**Hover arrow**: when the pointer rests on the chip for about 120 ms, a `→` button slides out to the right of the chip (about 150 ms, 24 px square, faint at rest and full opacity on hover or focus). It stays visible while the pointer is over the chip or the arrow, and for 250 ms after it leaves, so the pointer can travel to it without flicker. It also appears when the chip has keyboard focus. Clicking the arrow, or pressing `Enter` or `Space` on the chip, opens the popover.

**Popover** (about 360 px wide, in-page, not a browser window): anchored under the chip, flipping above when there is no room and staying inside the viewport. Top to bottom it shows the category chip and role title; company, location, type, and experience on one line; a two-line summary; the primary `Apply` button with the link's host shown (for example forms.gle or lever.co); up to two secondary links; a line saying where the link was found; and `Open post`, Save, and Applied. It never opens the post and never loads comments. `Esc`, an outside click, or scrolling its card out of view closes it, and focus returns to the chip. Only one popover is open at a time.

| State | What the user sees | Trigger |
| --- | --- | --- |
| Instant | Tier 0 results (role, link, marker) within 150 ms | Click on the arrow |
| Enriching | Tier 0 content already shown, with skeleton lines for the summary and company | Tier 1 model running |
| Ready | Full summary and links. Model-written text is labelled 'Generated on your device' | Model returns valid output |
| Link in comments | 'The poster put the apply link in the comments. Open the post to see it.' with `Open post` | Comments cue found, no link found, and the peek is off or failed |
| Link after cutoff | The link, with 'Found in the part LinkedIn hides behind more' | Link found past the clamp offset |
| No link | 'No apply link found in the visible post text' with `Open post` | No link and no cue |
| Model unavailable | Tier 0 content with 'Model summary unavailable' | Timeout, a slow device, or `Rules only` mode |
| Peeking comments | Tier 0 content with 'Checking this post's comments...' | Peek is on and the user clicked the arrow on a post marked Link in comments |
| Link from comments | The link, labelled 'Found in the comments' | The peek returned a link |

**Toolbar**: sticky strip with a category chip bar showing counts, collapse-all or expand-all, a tagged counter, and a settings gear.

**Accessibility**: all controls focusable, ARIA labels, visible focus rings, `prefers-reduced-motion` respected, and light and dark contrast of at least 4.5:1.

**Style**: the chip and arrow never shift LinkedIn's layout. The arrow slides into space reserved beside the chip, and animations are skipped when `prefers-reduced-motion` is set.

**Interaction accessibility**: the chip is a real `button` with `aria-haspopup='dialog'` and `aria-expanded`. The popover is a `dialog` with an accessible name (the role title). Tab reaches the chip, `Enter` opens, and `Esc` closes. Our elements stop `click`, `mousedown`, and `pointerdown` from bubbling out of the Shadow DOM, and the extension never dispatches events onto LinkedIn's elements (rule R2).

## 11. Performance and reliability

- Per-post processing budget: under 10 ms on a mid-range laptop (extraction runs in a worker).
- Observer overhead: under 5% of main-thread time while scrolling.
- Memory: under 30 MB for 500 tagged posts.
- No visible layout shift when collapsing: the collapse CSS is applied before first paint of new nodes where possible.
- Kill switch: a toolbar toggle that disables the extension on the page instantly and restores the original cards.
- Degradation: if parsing fails for a post, leave that post untouched.

**Tagging budget**

- Coverage: 100% of rendered posts get a chip. On a page of 50 posts, all chips appear within 1 s of the page settling, with under 20 ms of Tier 0 work per post at p95.
- Order: posts in or near the viewport are tagged first, and the rest in idle batches.
- Popover: opens within 150 ms with Tier 0 content.
- Footprint: one small Shadow DOM host per post, created lazily for off-screen posts and removed when LinkedIn removes the card.

**Model budgets (Tiers 1 and 2)**

- Download: user-approved, under 1 GB for the primary model (community builds report about 0.5 GB), and resumable.
- Warm-up: model load under 15 s on WebGPU after the first download. It never blocks the page or Tier 0 tagging.
- Memory: the offscreen document closes after 5 minutes idle and reloads on demand.
- Summary latency: p50 under 3 s on WebGPU and under 10 s on WASM. Backend p95 under 2 s per batch.
- Timeouts: a model call that fails or exceeds 15 s shows the Tier 0 result with a 'Model summary unavailable' note.

## 12. Privacy and security

- By default no post text leaves the device: Tiers 0 and 1 run entirely inside Brave. The only default network call is the one-time, user-approved model download. There are no analytics, no error reporting, and no remote scripts.
- Tier 2 (our backend) is off by default. Turning it on shows a plain-language notice that rendered post text is sent to our server, and the server stores nothing.
- Model output is untrusted data. It is validated against a schema and rendered as text only, so a post that tries to inject instructions cannot change what the extension does.
- All injected HTML is built with safe DOM APIs (no `innerHTML` with page text) to prevent XSS from post content.
- Links shown in the panel are rendered with `rel='noopener noreferrer'` and open in a new tab on user click.
- A privacy statement in the options page lists exactly what is read, what is stored, what is sent, and what is never done.

## 13. Test plan

- **Fixture corpus:** save 300 or more rendered result-page DOM snapshots from Brave, covering link in body, link after the cutoff, link in comments, no link, image posts, reposts, polls, and multilingual posts.
- **Classifier eval:** a hand-labelled set of 300 posts. Targets: hiring gate F1 at least 0.9, category precision at least 0.85 for the default taxonomy, link recall at least 0.9 on posts where the link is in the rendered text.
- **Bait-marker eval:** hand-label where the link sits for 200 posts. Target: at least 90% agreement across `Link visible`, `Link after cutoff`, and `Link in comments`.
- **Unit tests:** link decoder, regex extractors, taxonomy matching, clamp-offset measurement, and the collapse CSS engine.
- **Integration:** Playwright against saved fixtures in a headed Brave persistent context (Brave's binary as the executable, the extension loaded with `--load-extension`), plus a manual live pass of 20 minutes per milestone.
- **Shields matrix:** default, Aggressive, and off, on the live results page.
- **Compliance checks:** a CI lint that fails the build if the source contains `.click(`, `scrollTo`, `scrollIntoView`, `dispatchEvent`, `fetch(`, `XMLHttpRequest`, or `WebSocket` outside an allow-listed module.
- **Layout-change drill:** break the selectors on purpose and confirm the extension does nothing and shows the warning.

**Model tests**

- **Model eval:** run rules only, the on-device model, and the backend model on the same 300-post labelled set. Targets: role title exact or near match at least 0.8, company at least 0.85, and no metric worse than rules alone.
- **Latency and memory:** summary p50 under 3 s on WebGPU and under 10 s on WASM after warm-up. Record first-load time and peak memory on a mid-range laptop and a low-end laptop.
- **Injection tests:** posts that contain instructions aimed at the model, such as 'ignore previous instructions' or fake JSON, must not change the output schema or trigger any action.
- **Licence check:** CI fails if a pinned model's card does not show Apache 2.0 or MIT, or if the revision hash is missing.
- **Backend (if built):** a load test at the free-tier budget, rate-limit behaviour, and a check that logs contain no post text.

**UI tests**

- **Coverage:** on fixture pages of 10, 25, and 50 posts, every rendered post gets a chip and the toolbar count equals N, all within 1 s of the page settling.
- **Late posts:** posts appended after the first render get chips without a reload.
- **Hover timing:** the arrow appears after about 120 ms, survives the 250 ms grace period, and does not flicker when the pointer moves from chip to arrow.
- **Event isolation:** clicking the chip, arrow, or popover never opens the LinkedIn post or triggers its handlers (assert no navigation and no LinkedIn handler fired).
- **Popover placement:** correct flip and clamp at all four viewport edges, and at 80%, 100%, and 125% browser zoom.
- **Keyboard and screen reader:** Tab reaches the chip, `Enter` opens, `Esc` closes and returns focus, and the dialog has an accessible name.
- **Link states:** one fixture per popover state in the states table.

## 14. Milestones

| Milestone | Scope | Exit criteria |
| --- | --- | --- |
| M0: Spike (4 to 5 days) | Inspect the live DOM in Brave for 200+ posts, starting with posts that show a 'see more' control: text and link presence, link position, and whether `chrome.sidePanel` works. Benchmark the shortlisted models in an offscreen document: download size, load time, latency, memory, WebGPU versus WASM. Estimate backend cost per summary in neurons. Test the per-click comments peek (FR-23) on a throwaway account and record any throttling. | Written findings and a go or no-go on the core promise (target: 70% of apply links resolved without a click). A chosen primary model, and a decision on whether Tier 2 is needed. |
| M1: Collapse, tag, marker (1 week) | FR-1 to FR-4, FR-8, FR-10, FR-20, loaded unpacked in Brave. | 95% of rendered posts collapsed and tagged on live pages, and the marker eval met. |
| M2: Summary panel, links, on-device model (1.5 weeks) | FR-5 to FR-7, FR-9, FR-11, FR-12, FR-21, FR-22. | Panel works on the fixture corpus. The model eval and latency targets are met. |
| M3: Toolbar, shortcuts, saved list (1 week) | FR-13 to FR-17, FR-24, Export and Import, plus FR-23 only if M0 approves the peek. | Shields matrix passes. |
| M4: Backend, only if M0 says it is needed (1 week) | FR-18: a Cloudflare Worker gateway in front of the hosted open models. | p95 under 2 s per batch inside the free allocation, and logs contain no post text. |
| M5: Dogfood (2 weeks) | Daily use in Brave. | No layout breakage and no account warnings. |
| M6: Safari and Xcode port (later) | Converter and app wrapper. | Separate PRD. |
| M7: Fit score (later) | FR-19, local only. | Separate PRD. |

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| LinkedIn restricts or flags the account | High | The design rules in section 3, a minimal host scope, the kill switch, and a clear warning at install. Use a non-critical account for the first weeks. |
| Posts that use the self-comment trick stay one click away | High | Accepted limit of v1. The marker makes them identifiable, so the click goes only to relevant posts. |
| Full post text is not in the DOM | High | M0 spike first. Fall back to the 'Post may continue' hint and the `Open post` link. |
| Many machines cannot run the on-device model | Medium | Tier 0 still works on its own. Offer Tier 2 or a local server as opt-in options. |
| Sending post text to our backend adds ToS and privacy exposure | Medium | Tier 2 is off by default, stores nothing, and shows a plain notice. Prefer on-device and local-server paths. |
| Free hosting limits change (Oracle already cut its allowance in June 2026) | Medium | Keep the backend thin and replaceable, avoid lock-in, and set a budget alarm. |
| Model or runtime quirks (for example WebGPU decoder issues) | Medium | Pin versions, test q4f16, q8, and fp16, and fall back to WASM and then to Tier 0. |
| A pinned model repo changes or disappears | Low | Pin commit hashes, verify SHA-256, and keep the weights file cached locally. |
| Posters change the trick (link in an image, pinned comment, or a DM-only flow) | Medium | The cue phrase list is editable, and unknown layouts show `No link found`. |
| Markup changes break the adapter | Medium | The adapter isolates selectors, stable attributes come first, a health check shows a warning, and failure means doing nothing. |
| Misclassification or a wrong model summary | Medium | Show a confidence hint, label model output as generated, make the taxonomy editable, and keep the one-click path to the original post. |
| Brave Shields or a Brave update interferes | Medium | The Shields matrix test, no dependence on blockable resources, and a toolbar warning when posts are not found. |
| Unpacked build needs a manual reload | Low | The options page shows the build version and a reload reminder. |
| The per-click comments peek is an extension-made request to LinkedIn | High | Off by default, one request per user click, no prefetch, rate caps, and an immediate stop on any throttling, captcha, or checkpoint. Test on a throwaway account in M0 before any use on a main account. |

## 16. Open questions

1. Summary panel: an in-page drawer is assumed. Is an inline popover preferred?
2. Should the `Intern` flag be a separate badge or its own category?
3. Is a personal-use build enough, or will this be shared with others (which raises the compliance and store stakes)?
4. After M0, do we turn on the per-click comments peek (Option 2 in section 6), accepting higher account risk, or stay passive for comments?
5. Which Brave platforms matter first: macOS only, or Windows too?
6. Which markets and languages matter for the taxonomy and the comments cue list (English only at first)?
7. After the M0 benchmark, is Gemma 4 E2B the primary model, or does a smaller Qwen3 model fit better?
8. If Tier 1 is not viable on enough machines, are we comfortable sending post text to our own backend, or do we stay with rules plus the local-server option?

## 17. Sources

Figures below come from search results read on 3 Nov 2026, not from fully fetched pages. Re-check pricing, limits, and licences before committing.

- [Hugging Face: How to use Transformers.js in a Chrome extension](https://huggingface.co/blog/transformersjs-chrome-extension)
- [Gemma Gem: a Gemma 4 extension running on WebGPU (reference implementation)](https://github.com/kessler/gemma-gem)
- [Google releases Gemma 4 under Apache 2.0 (The Next Web)](https://thenextweb.com/news/google-gemma-4-open-models-apache-2-launch)
- [Brave adds GPU fingerprinting protections in 1.93 (CyberInsider)](https://cyberinsider.com/brave-browser-adds-new-defenses-against-gpu-fingerprinting/)
- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Oracle halves the Always Free Ampere A1 allowance (InfoQ)](https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)
- [Hugging Face Spaces overview](https://huggingface.co/docs/hub/en/spaces-overview)
