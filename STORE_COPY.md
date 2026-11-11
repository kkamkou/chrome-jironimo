# Jironimo for JIRA™ — Marketing & Chrome Web Store Copy Kit

## 1. Chrome Web Store Short Description (≤ 132 characters)

**Option A (125 chars — Current Manifest):**
> Track Atlassian JIRA issues, run JQL workspaces, switch statuses, and log work time right from your browser toolbar.

**Option B (129 chars — Action & Shortcut Focused):**
> Live JQL Workspaces, Metro Issue Tiles, inline status transitions & 1-click Worklog Timer for JIRA™ right from Chrome (Alt+J).

---

## 2. Chrome Web Store Detailed Description

**Tame Atlassian JIRA™ from your browser toolbar (`Alt + J` on Windows/Linux, `⌘ + J` on macOS)—without opening heavy tabs or breaking your focus.**

**jironimo for JIRA** turns your active JIRA filters into a high-contrast, live Metro **Tile** board right inside Chrome. Monitor multiple JIRA Cloud and Data Center **Accounts**, switch **Issue** statuses inline, and record accurate hours with a built-in **Worklog Timer**.

---

### BUILT FOR AGILE TEAMS

#### For Software Developers & Engineers
* **Stay in Deep Code Flow:** Press `Alt + J` (`⌘ + J` on Mac) to check assigned sprint Issues, pull-request review queues, or production bug filters without leaving your documentation or IDE tab.
* **One-Click Worklog Timer:** Hit Play on any Issue Tile when you start working. The toolbar badge displays your elapsed time and submits the worklog directly to JIRA when stopped (sessions under 1 minute are ignored so accidental clicks never pollute worklogs).
* **Inline Status Transitions:** Move an Issue from *Open* to *In Progress*, *In Review*, or *Resolved* directly from the Tile toolbar.
* **Instant Live Filtering:** Type an Issue key, summary keyword, or reporter name to filter visible Tiles in milliseconds.

#### For Scrum Masters & Agile Coaches
* **Live Impediment Radar:** Create dedicated JQL **Workspaces** for sprint blockers, flagged tickets, and stale in-progress work with background desktop notifications.
* **Persistent Blocker Alerts:** Enable *Notifications require interaction* on critical Workspaces so sprint impediments never slip past unnoticed.
* **Detachable Standup Window (`1024×768`):** Pop Jironimo out into a standalone window for clean screen-sharing during daily standups, refinement, and retrospectives.
* **Multi-Account Squad Switching:** Connect up to 10 JIRA **Accounts** and switch between teams on the fly, or run Shared Workspaces across every server.

#### For Product Owners & Product Managers
* **Visual Backlog Hierarchy:** Scale **Tile** sizes proportionally by issue type—set *Epics* to Triple-width (`380×120`), *Stories* to Double-width (`250×120`), and *Tasks/Bugs* to Default (`120×120`) or Half (`55×55`).
* **Sample Custom Priorities from JIRA:** Pull your server's exact priority definitions in one click and map them to 30 vibrant Metro palette tones per Account.
* **Import Favorite JIRA Filters:** Bring all your saved favorite filters from JIRA into Jironimo Workspaces with a single click.
* **Progress Bars & Estimates at a Glance:** Track remaining time estimates, completion progress bars, and closed checkmarks right on the face of every Tile.

---

### SECURITY, PRIVACY & ARCHITECTURE
* **Zero Stored Passwords:** Jironimo authenticates through your active browser session cookie.
* **Zero Middleware Servers:** Every request goes directly from your Chrome browser to your Atlassian JIRA REST API (`v3` or `v2`). All settings stay on your machine (with optional native Google Chrome Sync).
* **Smart Connection Probe:** Paste any JIRA project, filter, or issue URL in Settings and click Verify—Jironimo normalizes the base address and probes `/rest/api/3/myself` and `/rest/api/2/myself` automatically.
* **Open Source:** Licensed under the Boost Software License 1.0 (BSL-1.0) at https://github.com/kkamkou/chrome-jironimo.

---

## 3. Role-Targeted JQL Workspace Recipes

### Software Developers
* **My Active Sprint Queue** (`icon: target`)
  ```jql
  assignee = currentUser() AND sprint in openSprints() AND status not in (Closed, Resolved) ORDER BY priority ASC, updatedDate DESC
  ```
* **Needs My Code Review** (`icon: code`)
  ```jql
  status = "In Review" AND assignee != currentUser() AND sprint in openSprints() ORDER BY updatedDate DESC
  ```
* **Assigned Production Bugs** (`icon: bug`)
  ```jql
  assignee = currentUser() AND issuetype = Bug AND status not in (Closed, Resolved) ORDER BY priority ASC, updatedDate DESC
  ```

### Scrum Masters
* **Sprint Blockers & Flagged Impediments** (`icon: fire`)
  ```jql
  sprint in openSprints() AND (priority in (Blocker, Highest) OR Flagged is not EMPTY) AND status not in (Closed, Resolved) ORDER BY updatedDate DESC
  ```
* **Stale In-Progress Issues (> 3 Days)** (`icon: clock`)
  ```jql
  sprint in openSprints() AND status = "In Progress" AND updatedDate < -3d ORDER BY updatedDate ASC
  ```
* **Unassigned Sprint Scope** (`icon: flag`)
  ```jql
  sprint in openSprints() AND assignee is EMPTY AND status not in (Closed, Resolved) ORDER BY priority ASC, created DESC
  ```

### Product Owners
* **Release Epics & Roadmap** (`icon: rocket`)
  ```jql
  issuetype in (Epic, Story) AND fixVersion = earliestUnreleasedVersion() AND status != Closed ORDER BY priority ASC, updatedDate DESC
  ```
* **Ready for PO Acceptance / UAT** (`icon: trophy`)
  ```jql
  status in ("Ready for Acceptance", "In UAT", "Resolved") AND sprint in openSprints() ORDER BY updatedDate DESC
  ```
* **Stakeholder & Watched Issues** (`icon: eye-2`)
  ```jql
  (reporter = currentUser() OR watcher = currentUser()) AND status not in (Closed, Resolved) ORDER BY updated DESC
  ```

---

## 4. Visual Asset Inventory (`images/`)

### Chrome Web Store Screenshots (`1280×800` PNG)
1. `images/store-1-overview.png` — Hero overview: Live Workspace Board, Worklog Timer & Priority Tiles
2. `images/store-2-developers.png` — Developer workflow: Inline Status Transitions & Worklog Timer
3. `images/store-3-scrum-masters.png` — Scrum Master workflow: JQL Workspaces, Validator & Blocker Notifications
4. `images/store-4-product-owners.png` — Product Owner workflow: Sampled Priority Colors, Metro Palette & Epic Sizing
5. `images/store-5-privacy-setup.png` — Security & Setup: Smart Connection Probe (REST API v3 & v2) & Local Privacy

### Chrome Web Store Promotional Tiles & Social Banners
* `images/promo-small-440x280.png` — Chrome Web Store Small Promo Tile (`440×280` PNG)
* `images/promo-marquee-1400x560.png` — Chrome Web Store Marquee Promo Tile (`1400×560` PNG)
* `images/og-social-1200x630.png` — Open Graph / Social Share Banner (`1200×630` PNG)

### Composite & Raw UI Captures
* `images/jironimo-frontend-full.jpg` (`736×768`) & `images/jironimo-frontend.jpg` (`640×668`) — Updated popup board composites
* `images/jironimo-options-full.jpg` (`1024×768`) & `images/jironimo-options.jpg` (`640×480`) — Updated 4-panel settings composites
* `images/ui-popup-board.png` — Raw popup board with active Worklog Timer
* `images/ui-popup-transitions.png` — Raw popup board with inline Transitions menu & Tools panel
* `images/ui-options-general-probe.png` — Raw General Settings with Connection Probe modal
* `images/ui-options-workspaces.png` — Raw Workspaces (JQL) Settings with verified queries
* `images/ui-options-colors.png` — Raw Priority Colors & Metro Palette Settings
* `images/ui-options-sizes.png` — Raw Issue-Type Tile Sizes Settings
* `images/ui-options-timer.png` — Raw Worklog Timer & Refresh Interval Settings
