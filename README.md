# SignJobs

**Find hiring posts in LinkedIn content search without losing the application link.** Signal reads posts already displayed in your Brave browser, identifies hiring details, and surfaces application links or email contacts beside the post.

> **Fastest start:** download the latest `SignJobs` release ZIP, extract it, and load its `hiring-post-skimmer/dist` folder in Brave. No Docker, Node.js, Python, account setup, or model download is needed to use Rules mode.

## Install in Brave

1. Download and unzip the latest release from this repository's **Releases** page. If you downloaded the source ZIP instead, continue to **Build from source** below.
2. In Brave, open `brave://extensions` and turn on **Developer mode**.
3. Choose **Load unpacked** and select the release's `hiring-post-skimmer/dist` folder.
4. Open LinkedIn and search for posts in **content search**. Use LinkedIn's own search and date filters. If the search tab was already open, refresh it once.
5. Signal adds a summary beside posts it can read. Use **Apply** to open an extracted HTTP(S) application link, or copy an email when the post asks applicants to email.

The extension is designed for Brave/Chromium's Manifest V3 format. Safari is not supported. Chrome/Edge may work, but Brave is the tested target.

## Build from source

For contributors or when no release ZIP is available:

1. Install Node.js (LTS) and Git if they are not already installed.
2. Clone this repository and open the project folder in VS Code.
3. In VS Code's integrated terminal, run:

   ```bash
   cd hiring-post-skimmer
   npm ci
   npm run build
   ```

4. In Brave, open `brave://extensions` → **Developer mode** → **Load unpacked**, then select `hiring-post-skimmer/dist`.

`npm run verify` also runs the type, passive-behavior, and unit checks before building. Browser-fixture checks are available with `npm run test:browser` when Brave and the test dependencies are installed.

## Optional local reasoning model

Rules mode works immediately and is the quickest, lightest option. The optional Qwen3-1.7B browser model can produce more contextual role explanations, but it requires WebGPU and downloads about **1.44 GB** of model files on the user's device. It is not included in GitHub releases and is not required to find links. Enable it in Signal Settings only if you want model-generated explanations and your browser/device supports it. The download and runtime have not been benchmarked across visitor devices; the rules-based summaries remain available if the model cannot run.

## What it does and does not do

- Reads LinkedIn content-search posts already loaded in your own page; does not run a crawler or backend.
- Inspects links already present in a post's DOM, including hidden/cropped link targets where available, and displays only HTTP(S) application links. It does not click **more** or fetch comments.
- Preserves LinkedIn's post content and layout; summaries appear alongside posts when the page has room.
- Works only with information the page has loaded. If a link is not present in the post DOM, expand/load the post yourself and let Signal rescan.
- Does not automate searching, scrolling, applying, messaging, or signing in; does not send post text to a server.

## For contributors

The active extension source, build notes, privacy details, and current limitations are in [`hiring-post-skimmer/README.md`](hiring-post-skimmer/README.md). The old Gmail/Google Sheets scraper and hosted job-radar experiments in this repository are archived and are not part of SignJobs.

## License

Third-party notices for the built extension are in [`hiring-post-skimmer/dist/THIRD_PARTY_LICENSES.txt`](hiring-post-skimmer/dist/THIRD_PARTY_LICENSES.txt). The optional Qwen model has its own Apache-2.0 license, linked in the extension's model manifest.
