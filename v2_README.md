# Stratum
### *The Intent-to-Outcome Productivity Engine*

[![Local-First](https://img.shields.io/badge/Privacy-100%25%20Local--First-blue)](#-complete-privacy--instant-speed)
[![Zero Setup](https://img.shields.io/badge/Setup-Zero%20Build%20Required-success)](#-getting-started-in-seconds)
[![Methodology](https://img.shields.io/badge/Methodology-Strict%20Separation%20of%20Concerns-purple)](#-how-stratum-works-the-core-loop)
[![License](https://img.shields.io/badge/License-MIT-slate)](#-license)

---

## 🎯 The Problem: The Busywork Trap

Most to-do lists and project management apps are passive digital dumping grounds. They make it easy to add hundreds of tasks, reward you for checking off low-value items, and leave you exhausted at the end of the day—wondering why your most important goals barely moved forward.

When every task looks equally urgent, you spend more time **managing lists and reacting to noise** than doing meaningful work. 

**Stratum was built to break this cycle.**

---

## 💡 What is Stratum?

Stratum is not another passive checklist. It is an **active execution engine** designed to bridge the gap between **what you intend to achieve** and **what you actually do today**.

Instead of treating all tasks equally, Stratum:
1. **Filters out distractions:** Evaluates whether a task directly serves your core objectives before you spend hours on it.
2. **Eliminates decision fatigue:** Automatically organizes your day into a clear **2x2 Focus Matrix** so you always know what to tackle first.
3. **Guarantees real results:** Asks for tangible evidence before high-impact tasks can be marked "done," ensuring you actually solve problems rather than just tick boxes.
4. **Protects your data & focus:** Runs entirely inside your browser with zero loading spinners, complete offline support, and 100% local privacy.

---

## 🔄 How Stratum Works: The Core Loop

Stratum connects your long-term goals to your daily actions through a seamless 4-step workflow:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 1. CAPTURE      │ ──►  │ 2. ALIGN        │ ──►  │ 3. EXECUTE      │ ──►  │ 4. CONFIRM      │
│ Jot down raw    │      │ Stratum scores  │      │ Focus on Q1;    │      │ Attach proof to │
│ ideas, notes,   │      │ impact & blocks │      │ see bottlenecks │      │ verify real     │
│ or tasks.       │      │ scope creep.    │      │ on the DAG map. │      │ achievements.   │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## ✨ Key Features & How They Benefit You

### 1. The Dynamic 2x2 Focus Matrix
*Never start your morning wondering what to work on.*

Stratum continuously evaluates your tasks across two fundamental dimensions: **Strategic Leverage (Impact)** and **Alignment (Sync)**. It automatically sorts your workload into four actionable quadrants:

* 🟢 **Q1: Core Priorities (Focus First):** High-leverage, direct-alignment work. This is your primary mission for the day.
* 🟡 **Q2: High Leverage (Evaluate):** Big opportunities that need clearer direction or refinement before execution.
* 🔵 **Q3: Maintenance (Delegate / Schedule):** Necessary operational chores that keep the lights on without driving major growth.
* 🔴 **Q4: Scope Creep (Eliminate):** Low-value distractions. Stratum automatically locks these so they don't steal your time.

---

### 2. Automated Scope-Creep Protection
*Saying "no" to distractions is hard—Stratum does it for you.*

Whenever you create a task, Stratum checks how closely it aligns with your parent project. If an item doesn't directly contribute to the goal (alignment below 50%), the system **hard-locks the task** into a review state. This gives you a moment of intentional friction to ask: *"Is this actually necessary, or is it just busywork?"*

---

### 3. Interactive Project Maps (Dependency DAG)
*See what's actually blocking your progress.*

Complex goals often fail because a tiny prerequisite was overlooked. Stratum provides an **interactive visual dependency map** that shows which tasks unlock others:
* **Critical Path Highlighting:** High-impact blockers are automatically elevated so you unblock major milestones first.
* **Cycle Prevention:** Prevents you from creating impossible loops (e.g., Task A waiting for Task B, which is waiting for Task A).

---

### 4. Proof-of-Outcome Verification
*Completing an activity is not the same as achieving an outcome.*

Writing code isn't the same as fixing a bug. Sending an email isn't the same as closing a deal. 

For high-impact tasks, Stratum introduces a **Verification Gate**. Before a major task can be closed, you attach a piece of real-world evidence—a link, a test result, a metrics confirmation, or a document. This builds an undeniable log of verified accomplishments.

---

### 5. Realistic Completion Forecasting (Monte Carlo)
*Know when projects will genuinely finish without guessing.*

Instead of relying on optimistic gut feelings, Stratum runs **1,000 statistical simulations** based on your real daily pace. It gives you honest completion windows:
* **P50 (Aggressive):** The earliest realistic finish date.
* **P80 (Recommended):** The reliable date you can confidently commit to.
* **P95 (Safe):** The worst-case buffer for high-uncertainty projects.

---

### 6. The 5-Whys Problem Clarifier
*Solve root problems instead of treating surface symptoms.*

Before spending weeks building a solution, use Stratum's built-in **5-Whys Diagnostic**. It guides you step-by-step from a surface frustration (e.g., *"Our onboarding is slow"*) down to the root operational breakdown (e.g., *"No automated identity verification"*), ensuring you build the right thing the first time.

---

## 🔒 Complete Privacy & Instant Speed

* **100% Local-First:** Your tasks, goals, notes, and metrics are stored directly inside your browser's private database (`IndexedDB`). Nothing is sent to a third-party server without your explicit permission.
* **Zero Lag:** Everything renders instantly at 60 frames per second with no network loading spinners.
* **Works Completely Offline:** Use Stratum on planes, trains, or off-grid locations without losing functionality.
* **Multi-Tab Sync:** If you have Stratum open in multiple tabs, changes sync instantly in the background.

---

## 👥 Who is Stratum For?

* **Solo Creators & Builders:** Keep your multi-faceted projects organized without getting overwhelmed by administrative overhead.
* **Engineers & Technical Leads:** Map complex system dependencies, attach CI/CD verification proofs, and prevent architectural scope creep.
* **Product Managers & Strategists:** Keep daily team execution tightly tethered to quarterly outcomes and explicit non-goals.
* **Anyone Seeking Daily Focus:** If you are tired of chaotic, endless checklists and want an intelligent system that tells you what matters most right now.

---

## 🚀 Getting Started in Seconds

Because Stratum is built with modern, zero-dependency browser standards, **there are no build steps, compilers, or terminal installations required.**

### Option A: Open Directly
1. Download or clone this repository.
2. Open `public/index.html` in any modern web browser (Chrome, Safari, Firefox, Edge).
3. Start organizing your priorities immediately.

### Option B: Deploy to Cloudflare Pages (Free)
1. Fork or push this repository to GitHub.
2. In Cloudflare Pages, connect your repository.
3. Set **Build Output Directory** to `public` and leave the build command blank.
4. Your personal, private instance of Stratum is live on the web in under a minute.

---

## 🧪 Built-In Quality & Resilience Suite

Click on the **Adversarial QA Audit** tab inside Stratum to run a live, in-browser stress test. Stratum self-audits its mathematical formulas, storage persistence, dependency logic, and fuzzes 10,000 edge cases to verify that your system is running with **Grade A+ production resilience**.

---

## 📄 License

Distributed under the **MIT License**. You are free to use, modify, and host Stratum for personal or commercial productivity.
