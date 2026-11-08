<<<<<<< HEAD
## Build 0.9.2: blue-to-red liquid glass

Reload Signal at `brave://extensions` and refresh LinkedIn. Fabric styling has been removed. Summary bubbles now use a blue → violet → red CSS gradient, rounded glass edges, a translucent tinted surface, and a soft reflective highlight. White text and light pill-shaped Apply buttons stay readable over the gradient. The same glass palette works in both color schemes.

The treatment uses CSS only: no texture files, web-font requests or animated blur. Existing wrapping and post-boundary alignment remain in place. Static backdrop blur is limited to the note surface; inference behavior is unchanged.

## Build 0.9.1: fabric cards with a raised reading surface

Reload Signal at `brave://extensions` and refresh LinkedIn. The summariser now uses the **Cloth Alike** woven texture from [atlemo/SubtlePatterns](https://github.com/atlemo/SubtlePatterns), with an opaque rounded reading panel above it. Light mode pairs warm linen with an ivory surface; dark mode pairs charcoal fabric with a dark neutral surface. Text wraps as before, and Apply buttons use a contrasting blue accent.

The original 2,322-byte PNG is bundled unchanged and embedded at build time, so displaying notes requires no texture downloads or additional permissions. Attribution and the CC BY-SA 3.0 link appear in Settings, `assets/ATTRIBUTION.md`, and the built third-party notices. Pattern: [Cloth Alike by Peax Webdesign](https://www.toptal.com/designers/subtlepatterns/cloth-alike/). Source revision and SHA256 are recorded alongside the asset.

Browser checks verify that the bundled texture decodes, reading surfaces are opaque, and tested foreground/background combinations reach at least 4.5:1 contrast in both light and dark themes. The existing geometry, extraction, clipboard, closure and wrapping checks also pass.

## Build 0.9.0: company headers, fuller context, readable summaries

Reload Signal at `brave://extensions` and refresh LinkedIn. The extension details show **0.9.0**; the model revision is unchanged.

- Company and role are extracted separately across the available post content. “Hiring at Reelo!” becomes the company heading **Reelo**, with **Product Ops Intern & Product Marketer** below. “HIRING ALERT | PUMA IS HIRING A PRODUCT INTERN” resolves to **PUMA** and **Product Intern**, not ALERT. Explicit Company/Position fields and the hiring invitation take priority over banner words or author biographies.
- Summaries use two brief phrases with semantic task interpretation rather than copying duty sentences. Stated location, work mode and stipend can fill the second phrase. There is no automatic “Likely” prefix or “Role is ambiguous” message; role-based inference is identified by the explanation’s tooltip and accessible label. Typical task interpretation still does not establish employer-specific duties when those are missing.
- Notes now use up to **440 px** of available right-hand space (previously 320 px). Role and explanation text wrap naturally without ellipses. The previous two-*visual*-line cap is superseded by two short phrases that may wrap. Very short post bounds retain a vertically scrollable note, preserving all its content and the native post.
- Qwen Auto mode remains optional after a verified model download. It receives extracted company/role/location/pay before the bounded source context; the prompt requests paraphrases and rejects full-sentence echoing or vague replacements. Raw post inspection remains bounded and makes no extra LinkedIn requests. The local fallback also handles the reported Reelo and PUMA cases without model weights. Actual Qwen performance remains unbenchmarked.

## Build 0.8.2: softer, more readable typography

Reload Signal at `brave://extensions` and refresh LinkedIn. Summary cards, details, Settings and saved items now use a friendly local font stack led by Avenir Next on macOS, lighter headings and more comfortable spacing. Role explanations remain capped at two visual lines. No web fonts or extra downloads are needed.

## Build 0.8.1: infer work from the role title

Reload Signal at `brave://extensions` and refresh LinkedIn. No new model download is needed for this update if the 0.8.0 model is already verified.

Recognisable titles now produce typical tasks even when the post provides only recruiting slogans. Product Intern, AI Product, Product Analyst/Designer, Business Analytics, Founder’s Office, research, AI builder, operations, merchandising, project and creative roles have more specific references. Title variants such as “Intern – Product” are supported. Generic “Intern” explains supervised team/project work without inventing a function. Genuinely ambiguous titles still receive an honest uncertainty message.

For example, **Product Intern** → “Likely: Research user needs, test ideas and support product delivery.” / “Typical goal: turn customer problems into product improvements.” Both fit the existing two-line explanation layout. Concrete stated duties override generic expectations; a vague model reply cannot replace a useful title-based interpretation. The model prompt now explicitly requests occupational inference from the title rather than withholding tasks because a full JD is missing.

The expanded fallback works immediately in Rules mode and adds no memory-heavy model dependency. Qwen3-1.7B remains optional and its on-device performance remains unbenchmarked.

## Build 0.8.0: practical role interpretation in two lines

Reload Signal at `brave://extensions`, then refresh LinkedIn. Each explanation now has two visual lines: practical duties, then context/uncertainty. Hover a shortened line to read it in full. Inferred interpretations are labelled **Likely**. Extracted Apply links, email copying and closed-role status remain independent of model output.

### Enable the upgraded local model

1. Open the Signal extension icon → Settings.
2. Review **Qwen3-1.7B-ONNX · q4f16 · 1,435.2 MB** and approve its download. Older model downloads do not count as this revision. The current build only downloaded small configuration metadata during development; its weights have not been downloaded or benchmarked on your Mac.
3. Click **Download verified model** and approve the listed Hugging Face delivery hosts. Keep Settings open until verification completes. Successful verification enables Auto mode. If you already have the obsolete 0.5B weights, the Delete model button releases them before downloading the replacement.
4. Refresh LinkedIn. Auto mode interprets visible posts sequentially, including newly visible posts when you scroll. A short loading status accompanies the existing fallback. Completed interpretations are reused for the unchanged post during that page session; they are not persisted to disk.

The model is [Qwen3-1.7B (Apache-2.0)](https://huggingface.co/Qwen/Qwen3-1.7B), using the [browser-compatible ONNX export](https://huggingface.co/onnx-community/Qwen3-1.7B-ONNX) pinned in `src/model-manifest.json`. It is a practical size candidate for M1/8 GB, not a measured RAM or quality guarantee. WebGPU with `shader-f16` is required; there is no CPU fallback for this larger model. Run one summary at a time, cap input to 4,200 characters/output to 220 tokens, disable long thinking traces, allow 90 seconds including cold load, and unload after 60 idle seconds. Download size is not peak runtime RAM; close memory-heavy apps if needed. Rules mode uses no model weights and remains available.

The previous prompt/validator forced exact quotes, so changing models alone could not remove echoing. This build permits paraphrases, anchors them to exact source evidence, and labels the interpretation inferred. Its validator rejects malformed output, unsupported numeric details and several unsupported workplace assumptions; exact evidence is not proof of semantic correctness. The local fallback uses role references when duties are absent and preserves concrete stated duties when available. A fruit sorter is reasonably expected to inspect/grade fruit; the title alone does not establish a farmers market, restaurant, packhouse, particular fruit, pay or employer.

The new model/download path has not been tested end to end with weights. Its revision, file hashes, browser runtime support and delivery host were checked. The confirmed `us.aws.cdn.hf.co` delivery host is now allowed by optional permission/CSP; this fixes one blocked-host cause, but is not a guarantee that the earlier download error is fully resolved. Full-post link inspection still works without AI.

## Build 0.7.0: closed roles and copyable email applications

Reload Signal at `brave://extensions`, then refresh LinkedIn. Version **0.7.0** appears in extension details.

- Explicit closure cues such as “applications closed,” “no longer accepting applications,” or “position filled” display **Applications closed**. Apply links and email-copy actions are suppressed for these posts. Negated, future and conditional closure phrases are not treated as confirmed closure; a later explicit reopening supersedes an earlier closure.
- When the post asks for applications by email and no application URL is present, the compact summary shows the address with **Copy email**. Hidden post DOM and mailto destinations are supported. If clipboard access fails, the address is selectable for manual copy. Personal/corporate domains, `.in`, `.co.in`, plus tags, subdomains and international domain names are recognized. This checks address format, not mailbox existence or delivery.
- Displayed destination links must use HTTP or HTTPS. Mailto addresses are shown as copyable text rather than application hyperlinks; arbitrary linked words without a valid destination are ignored. Bare `www.` text is not automatically converted into a URL. HTTP(S) syntax alone does not prove that a destination is a relevant application page.

## Build 0.6.0: whole-post DOM link inspection

Reload Signal at `brave://extensions` and refresh LinkedIn. The extension details show **0.6.0**.

The link engine inspects each detected post’s DOM, like reading the Elements panel in Inspect. It examines full text and actual `href` values, hidden siblings, job previews, URL-bearing button attributes, title/ARIA labels, existing open shadow roots, and post-local full-text templates. CSS truncation, `hidden`, and `aria-hidden` do not prevent link recovery when the destination exists in that post’s HTML. It never evaluates JavaScript handlers, reads unrelated page state, clicks “more,” or makes LinkedIn requests.

Application/form/ATS links and explicit application actions rank above company homepages and promotional links. Original destination URLs and query parameters remain intact; display labels may remove tracking parameters. Comment links retain their comment provenance. Known LinkedIn redirect targets are decoded for classification without fetching them. Unresolved short links remain the actual short URL.

Compact notes show **Apply** for likely application links and **Open link** for other destinations. When no destination is present, the engine distinguishes incomplete inspection, content still behind native “more,” and no link found in loaded content. If a click is required to download the rest of the post, that link cannot be extracted before LinkedIn delivers it; manually expand the post and Signal re-inspects automatically. Destination attribute changes also trigger re-inspection. Comments are only inspected when already present in the post DOM.

Inspection is bounded to 6,000 DOM nodes and 500 link candidates per post and reports an incomplete scan when a limit is reached. No model is used to invent or reconstruct URLs. Evidence is transient, with only your explicitly saved items persisted as before.

## Build 0.5.0: compact Apply notes

Reload Signal at `brave://extensions`, then refresh the LinkedIn tab. Confirm version **0.5.0** in the browser’s extension details; the page no longer displays a version/count/filter toolbar. Settings remain available from the extension icon.

Each compact note contains a role title, author when identifiable, up to three lines of responsibilities, and a direct **Apply** link when extracted. Body links hidden by CSS and native LinkedIn job links are supported. The title opens optional details. Explicit DM/comments instructions remain visible; missing author fields are omitted. Text not delivered in the DOM cannot be recovered without manually expanding the native post.

Notes use absolute document coordinates with a constant eight-pixel offset from the detected post top. Scrolling clips notes behind fixed headers and viewport edges, without pinning them or triggering reclassification. Native content changes and resizing update geometry; newly loaded posts get their own notes. Visible posts take priority, including those at the top of the viewport, and all pending posts receive a loading spinner before classification starts. This is usually brief in rules mode. Notes still require at least 200 pixels of space on the right. Ads with explicit labels remain skipped.

The new adapter uses text to locate a post, then recovers its rounded visible surface for complete bounds. Profile links provide author names when older author selectors are missing. This remains a passive extension reading only rendered page content.

The sections below document prior releases and may describe superseded toolbar/collapse behavior.

## Build 0.4.0: separate reading layer

Reload the extension at `brave://extensions`, then refresh LinkedIn. The toolbar must show **Signal 0.4.0**.

Original posts are never collapsed, hidden, or resized by Signal. Notes appear in a separate right-hand layer, covering the sidebar/footer space, aligned within each detected post’s vertical boundaries. Filters affect notes only. Notes hide when fewer than 210 pixels of right-hand space are available; widen the browser window to show them. Summaries scroll within the same boundaries. Native LinkedIn “more” remains under your control.

A shared local vocabulary reference (`src/vocabulary.ts`) covers common recruitment invitations, exciting opportunities, campus drives and graduate roles. It retrieves matching phrases for discovery and classification; it is a deterministic phrase reference, not a vector database or model training. Generic opportunity announcements require job-related context. Explicit Promoted/Sponsored/ad metadata is excluded before classification; visa sponsorship in role prose is retained. Unlabelled ads cannot be identified reliably from text alone.

Browser checks use synthetic LinkedIn layouts in an isolated Brave profile, not your logged-in account. Real LinkedIn markup can still require adapter updates. The earlier optional model-download issue is not addressed by this layout release.

## Update 0.3.1 — freshers and 2026 graduates

Discovery also recognizes freshers, recent/new graduates, graduate trainees, 2026 pass-outs and batch/class of 2026. A hiring invitation gets a Graduate / Fresher fallback category; role-specific categories still take priority. The 2026 Batch badge requires explicit cohort wording and is never inferred merely from “freshers.” Graduation announcements alone remain Not hiring. Reload the extension and your LinkedIn tab; the toolbar shows Signal 0.3.1. This annotates posts you load yourself; enter your desired queries in LinkedIn search.

## Update 0.3.0 — feed text and orientation

Reload Signal in `brave://extensions`, then reload the LinkedIn search tab. The toolbar must say **Signal 0.3.0**. Earlier screenshots showed the old toolbar text.

Discovery starts with rendered text nodes and normalizes curly apostrophes. Text positions determine the feed column, with the reference screenshot’s centre-left orientation supported. Navigation and sidebar regions are excluded. Recognized post regions remain registered after collapse so the next scan cannot repeatedly remove and reinsert them. Scroll, resize and **Rescan text** trigger discovery without automated scrolling.

The toolbar reports matching text blocks, regions and column position. TypeScript/passive checks and an isolated Brave fixture matching the supplied orientation passed, including an unrecognized CSS layout, DM summary, sidebar exclusion, rescan and collapse stability. This is synthetic verification; the user's live LinkedIn DOM is not yet verified. The separate model-download failure is still unresolved.

# Signal — Hiring Post Skimmer for Brave

Active project as of 3 November 2026. A Manifest V3 extension that reads the LinkedIn content-search posts you have already loaded, tags them, and turns them into compact rows. The previous crawler, Sheets/Gmail agent and radar builds are preserved under the legacy snapshot; they are not used by this extension.

## Load it in Brave — no terminal needed

1. Open `brave://extensions` in **Brave**.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the **dist** folder at `/Users/aryanmahanta/Downloads/Projects/Job_Function_Scrapper/hiring-post-skimmer/dist`.
5. Open LinkedIn **content search** in Brave, search yourself, and apply LinkedIn's date/people filters yourself. For an already open search tab, reload it once after installing.
6. Hover a category chip and click **→**, or focus the chip and press Enter. The summary opens without expanding the original post.
7. Use a normal application link, **Open post**, **Save**, or **Applied**. **Show post** reveals the existing card but does not press LinkedIn's “more” control.

The extension popup contains saved items and Settings. The floating toolbar filters categories and outcomes, expands/collapses the existing cards, and has an immediate Disable switch that restores them. `j`/`k` focus adjacent rows without scrolling; Enter opens the focused summary; `o` opens its first application link as a direct keyboard action; Esc closes a summary.

When navigating into content search from another LinkedIn page through an SPA transition, a reload may be necessary: the content script deliberately is not injected throughout the entire site. Once injected, leaving content search restores the page, and returning within that document reactivates it.

## Your explicit overrides

- Full text is **not assumed to be available**. We read `textContent` from the post's text container, including CSS-clamped content already present behind “more”. We never click “more”. If the rest was not loaded, the summary says **Post continues, link not in the available text**.
- **Role summary · Link in comments** appears only if the author explicitly says so and no application link was found in the post body/anchors. Already-rendered comment links can be shown with a comment-source label. “Link below” is not treated as a comments instruction by default.
- **Role summary · Need to DM** appears for explicit whole-word DM/contact instructions. “Admin”, “don't DM”, “no DMs”, and “do not message” do not trigger it.
- A body link remains the primary action when a post also asks for a DM. The DM note remains visible.
- Comments are read only if already present because of your own actions. The extension does not load comments or implement the PRD's undecided per-click peek exception.

## Rules versus the optional model

**Rules mode is fully usable immediately**, with no model download, paid API, backend or Codex inference. It produces an extractive role brief and explicit outcome markers. No resume-fit scoring is included in this pivot.

Optional model:

- `onnx-community/Qwen2.5-0.5B-Instruct`, Apache-2.0, q4 ONNX.
- Pinned revision: `22942cb7d7ba4cc81bb4673549ca4d4614469b5e`.
- Exact files/hashes in `src/model-manifest.json`; total approximately **793.2 MB**. This is larger than its parameter count might suggest. Actual RAM and speed on your M1 have **not yet been benchmarked**.
- In Settings, approve the download and click **Download verified model**. Brave asks for optional Hugging Face download permissions. Each file is SHA-256 checked using streaming hashing and cached on your device. Completed files are reused after interrupted downloads; an interrupted individual file restarts from its beginning.
- Auto mode uses the model only when you open a summary. It attempts WebGPU, then WASM; inference is single-file/one-at-a-time with one WASM thread. A hard 15-second limit terminates the worker and retains the rules result. Cold starts may hit this limit.
- The model is constrained to source-grounded excerpts. Entity values must occur in the available text. URLs and comments/DM decisions remain under deterministic rules. Invalid or ungrounded output is discarded.
- A worker in an offscreen extension document hosts inference; it closes after five idle minutes. **Delete model & release memory** removes the cached files and closes the runtime.
- The model's actual download/inference path is implemented but is not marked production-validated until a consented download and M1 benchmark are completed. Rules mode is the reliable initial path.

The model choice is deliberately smaller than the PRD's unverified multi-billion-parameter suggestion. Its public [ONNX repository](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct) and [upstream licence](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) were verified. Bundled Transformers.js and ONNX runtime execute locally; no remote executable scripts are loaded.

## Build or update — Cursor terminal

From the project root:

```bash
cd hiring-post-skimmer
npm ci --no-audit --no-fund
npm run verify
```

Or use **Cursor → Terminal → Run Build Task → Skimmer: build Brave extension**. After rebuilding, click the extension's Reload button in `brave://extensions`, then reload your search tab.

`npm run verify` runs TypeScript checking, passive-network/source checks, unit/DOM tests and the build. `dist/` is the unpacked extension. Model weights are not part of the extension package. The bundled WASM runtime makes the package about 33 MB.

Optional browser fixture test (Brave installed):

```bash
npm run test:browser
```

It creates a temporary browser profile, intercepts LinkedIn URLs with synthetic local fixtures, and never signs in to LinkedIn. Set `BRAVE_PATH` if Brave is installed elsewhere. The integration test needs the `playwright` development dependency. Reports and screenshots are under `artifacts/`.

## Privacy and permission boundaries

- Only content-search documents run the content script. Manifest host paths do not imply that Chromium's permission prompt will display path-level scope; browser prompts can show the LinkedIn domain.
- No LinkedIn HTTP requests from extension code, no cookies/tokens/internal APIs, no synthetic clicks or scrolling, no auto-apply/DM, no telemetry and no backend.
- Full post text exists only transiently in memory. Session state retains derived summaries/links; it is removed when the original card disappears, on route teardown, or tab close.
- `storage.local` stores settings, model-download metadata, and only explicitly Saved/Applied items (ID, title, company, URLs, status, timestamp). It does not store post bodies or model prompts.
- Export/Import in Settings transfers only settings and saved fields. Import validates URL schemes and strips extra fields.
- A LinkedIn safety redirect shows the decoded target but preserves the original href. `lnkd.in` links are never expanded by network requests. Links from rendered comments are labelled and are not verified as author-owned or safe.
- The extension changes the page layout. LinkedIn's rules can restrict extensions that modify or scrape its pages. Passive behavior does **not** guarantee account safety. No claim of LinkedIn approval is made.

## Validation boundaries

Implemented: passive discovery, route teardown, compact rows, editable taxonomy and cues, instant rule summaries, exact explicit outcome handling, link decoding, already-loaded comments, on-demand model integration/manager, toolbar filters, keyboard/focus behavior, saved/applied popup and JSON portability.

Deferred by PRD phase/decision: per-click LinkedIn peeks, backend/local-server modes, resume scoring, Safari and store publication. There is no hidden fallback to a paid service or the legacy crawler.

Synthetic unit and browser fixtures are not the PRD's requested 300 real-post corpus. Live selector coverage, 20-minute LinkedIn dogfood, default/Aggressive/off Shields matrix, screen-reader testing, and real M1 model latency/memory remain to be measured. Parsing failures leave the original post expanded. An unknown page layout shows a warning instead of guessing selectors or fetching data.

## Source map

- `src/adapter.ts`: versioned LinkedIn selectors, DOM-only read, clamp evidence and post identity.
- `src/rules.ts`: pure hiring/category/link/cue/summary functions and model-output validation.
- `src/background.ts`: rules processing in the extension service worker, storage and model routing.
- `src/content.ts`, `src/ui.ts`: observers, reversible CSS collapse, Shadow DOM controls and popover.
- `src/offscreen.ts`, `src/model-worker.ts`, `src/model-download.ts`: optional model lifecycle, verified download and offline inference.
- `docs/PRD-v0.2.md`: original supplied PRD, preserved as reference. This README's explicit overrides and implemented/deferred status take precedence.
=======
# SignJobs
faster job filtering
>>>>>>> origin/main
