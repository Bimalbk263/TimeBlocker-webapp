# ⏳ TimeBlock Studio

A lightweight, privacy-focused daily planner and focus companion built with pure **vanilla JavaScript, CSS3, and HTML5**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![No Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)]()
[![Platform: Web](https://img.shields.io/badge/Platform-Web-orange.svg)]()

> **Live Demo:** [Launch TimeBlock Studio](https://Bimalbk263.github.io/TimeBlocker-webapp/)

---

## ✨ Features

- **Visual Time Blocking:** Create color-coded blocks for Deep Work, Classes/Lectures, Errands, Breaks, and Sleep.
- **Unassigned Free-Time Detection:** Automatically highlights scheduling gaps between blocks to prevent accidental overbooking.
- **Synced Focus Timer:** Launch dedicated focus sessions directly from any block with countdown display and synthesized Web Audio completion chimes.
- **Nested Checklists & Notes:** Insert clickable checklist items (`[ ]`), numbered steps, and bullets directly within blocks.
- **Micro-Tasks Sidebar:** A dedicated quick-chores list to batch trivial errands into planned errand blocks.
- **100% Offline-First & Private:** Automatically saves state to `localStorage` after every change. No backend, no accounts, and no data tracking.
- **JSON Backup & Restore:** Export and import your routines at any time to prevent accidental browser cache loss.
- **Print & PDF Support:** Includes an optimized `@media print` stylesheet that strips away controls and formats a clean daily schedule agenda.

---

## 📁 Project Structure

```text
timeblock-studio/
├── index.html        # Semantic HTML structure & accessible layout
├── styles.css        # Clean CSS variables, responsive grid & print queries
├── app.js            # Vanilla JS logic (state, timer, storage, delegation)
└── README.md         # Documentation
