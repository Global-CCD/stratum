<div align="center">

# Stratum
### The Intent-to-Outcome Productivity Engine

[![Cloudflare Pages](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Vanilla%20JS)-success)](#-technology-stack)
[![Local-First](https://img.shields.io/badge/Privacy-100%25%20Local--First-blue)](#-local-first--privacy)
[![QA Audit](https://img.shields.io/badge/QA%20Score-100%2F100%20Grade%20A-brightgreen)](#-built-in-qa-audit)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**Stratum bridges the gap between what you want to achieve and what you actually do today.**  
It automatically scores your priorities, detects scope creep before you start working, and ensures high-impact work is verified with real evidence—all running locally in your browser.

[Quick Start](#-quick-start) • [How It Works](#-the-stratum-methodology) • [Architecture](#-under-the-hood-the-5-layer-architecture) • [Deployment](#-deploy-to-cloudflare-pages)

</div>

---

## 💡 Why Stratum?

Most productivity apps are passive to-do lists: they let you add endless low-value tasks, reward activity over impact, and leave you exhausted without real progress. 

**Stratum is an active execution engine.** It uses a mathematical scoring model and automated alignment checks to keep you focused exclusively on work that moves the needle.

* **No More Busywork:** Tasks that don't clearly serve your core goals are flagged and locked before you waste hours on them.
* **Objective Prioritization:** Sort your day dynamically based on real leverage, not just whatever deadline feels loudest.
* **Proof of Outcome:** Confirms you actually solved the underlying problem—not just checked off a box.
* **Instant & Private:** Runs 100% locally in your browser with zero loading spinners, zero build steps, and complete data privacy.

---

## ✨ Core Features

### 1. The Dynamic 2x2 Priority Matrix
Stratum automatically places every task into one of four actionable execution quadrants based on its **Impact** and **Strategic Alignment**:
* 🟢 **Q1: Core Priorities (Focus First):** High leverage, high alignment. This is your primary focus for the day.
* 🟡 **Q2: High Leverage (Evaluate):** High impact, but needs clearer alignment to your current goals.
* 🔵 **Q3: Maintenance (Delegate / Schedule):** Necessary operational work with lower strategic leverage.
* 🔴 **Q4: Scope Creep (Eliminate):** Low leverage and misaligned. Auto-locked to protect your schedule.

### 2. Automated Anti-Creep Safeguards
Every task receives a **Sync Index ($0\text{--}100\%$)** that measures how well it serves its parent project. If an item drops below $50\%$ alignment, Stratum locks the item to prevent impulsive, low-value work from cluttering your day.

### 3. Proof-of-Outcome Gatekeeper
Finishing an activity isn't the same as achieving an outcome. High-impact tasks ($\ge 7.0/10$) cannot be closed without attaching verifiable evidence—such as a data log, test confirmation, link, or sign-off.

### 4. Zero-Friction Ingestion
Drop in raw notes, voice memos, web bookmarks, or files. Stratum extracts metadata, generates cryptographic SHA-256 signatures, and routes them into your triage backlog.

---

## 📐 The Stratum Methodology

Stratum computes your daily backlog using a deterministic ranking formula:

$$\text{Priority Rank} = (\text{Impact Index} \times 0.6) + \left(\frac{\text{Sync Index}}{10} \times 0.4\right)$$

* **Impact Index ($1.0\text{--}10.0$):** Expected leverage or return on effort.
* **Sync Index ($0\text{--}100\%$):** Degree of direct contribution to the parent goal.
* **Priority Rank ($1.0\text{--}10.0$):** The single source of truth for sorting your daily focus.

---

## 🏗 Under the Hood: The 5-Layer Architecture

Stratum is built on **Strict Separation of Concerns (Strict SoC)**. Work moves through 5 distinct, non-leaking layers:

```
[ Layer 1: Epistemic   ] ──► Problems, Principles, Practice, Proof, Prompts
          │
[ Layer 2: Directional ] ──► Visions, Time Horizons (H1, H2, H3)
          │
[ Layer 3: Operational ] ──► Strategic Objectives, Scoped Projects
          │
[ Layer 4: Tactical    ] ──► Actionable Tasks, Step Checklists, Linked Specs
          │
[ Layer 5: Substrate   ] ──► Raw Files (Assets), Web Links, Scratchpad Notes
```

---

## ⚡ Technology Stack

* **Frontend:** Vanilla HTML5, CSS3 Custom Properties, ES6+ Modules (Zero compilation, zero bundlers).
* **Storage:** Native `IndexedDB` for instant, offline-first local persistence.
* **Cryptography:** Native `Web Crypto API` for client-side SHA-256 asset verification.
* **Vector Engine:** In-browser cosine similarity calculator with edge vector proxies.
* **Hosting & Edge:** Cloudflare Pages with lightweight Cloudflare Functions.

---

## 🚀 Quick Start

### Running Locally
Because Stratum requires zero build steps, you can run it with any local static server:

```bash
# Clone repository
git clone https://github.com/your-username/stratum.git
cd stratum

# Start static server (e.g., Python or Node)
npx serve public
# or: python3 -m http.server 8080 -d public
```
Open `http://localhost:8080` in any modern browser.

---

## ☁️ Deploy to Cloudflare Pages

1. Fork or push this repository to GitHub.
2. In the **Cloudflare Dashboard**, navigate to **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages**.
3. Connect your repository and configure:
   * **Build command:** *(Leave empty)*
   * **Build output directory:** `public`
4. Click **Save and Deploy**.

---

## 🧪 Built-In QA Audit

Stratum includes an automated, client-side quality assurance test suite. Click on the **Automated QA Audit** tab in the app to execute a real-time 100-point audit verifying:

* **Pillar 1:** Strict SoC layer boundary enforcement (Zero layer-jumping).
* **Pillar 2:** Priority Rank formula and anti-creep math accuracy.
* **Pillar 3:** In-browser vector math performance ($< 5\text{ ms}$).
* **Pillar 4:** Epistemic heuristic smell detection and Proof Gatekeeper locks.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

**Full Changelog**: https://github.com/your-username/stratum/commits/v1.0.0
```
