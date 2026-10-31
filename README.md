# AI Test Case Generator 🚀
### IBM SkillsBuild x Hacktiv8 — Capstone Project (IT Track)

[![IBM SkillsBuild](https://img.shields.io/badge/IBM-SkillsBuild-052F5F?style=for-the-badge&logo=IBM&logoColor=white)](https://skillsbuild.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 👨‍💻 Project Identity
- **Developer**: Muhammad Athalla Bagaskara
- **Institution**: Universitas Pembangunan Nasional "Veteran" Yogyakarta (UPN 'Veteran' Yogyakarta)
- **Program**: IBM SkillsBuild University Education — IT Track (AI Agent for Programming)
- **Tool Assisted**: IBM Bob AI Coding Assistant

---

## 📌 Executive Summary
**AI Test Case Generator** is an enterprise-grade, client-side automated QA test suite builder designed to revolutionize how modern software engineering teams bridge user stories with quality assurance. Developed during the **IBM SkillsBuild Capstone Challenge**, this tool ingests User Stories, Acceptance Criteria, and Feature PRDs to dynamically synthesize comprehensive, edge-case-resilient test cases complete with Preconditions, Steps, Expected Results, and Severity Badges.

---

## 🎯 Problem Statement
In fast-paced Agile & DevOps sprint cycles, manual test case authoring creates a severe bottleneck:
- **Time Consuming**: Crafting exhaustive test cases from scratch consumes 20-30% of a sprint's QA allocation.
- **Edge-Case Blindspots**: Manual writing often prioritizes the "happy path" and inadvertently neglects critical boundary conditions, security vulnerabilities, and negative scenarios.
- **Inconsistent Documentation**: Variability in formatting between different engineers leads to communication overhead and untracked defects reaching production environments.

### 💡 Solution
**AI Test Case Generator** standardizes, accelerates, and optimizes test creation using a deterministic pattern-extraction engine and structured prompt-driven architecture, enabling teams to generate compliant test suites in seconds.

---

## ✨ Key Features
1. **Intelligent Spec Ingestion**:
   - Parses complex User Stories, Acceptance Criteria, and PRD snippets.
   - Extracts 40+ functional verbs (`login`, `validate`, `checkout`, `upload`, etc.) and 30+ boundary keywords (`max`, `overflow`, `null`, `timeout`, `expired`).
2. **Multi-Type Testing Scope**:
   - Functional Testing
   - Edge & Boundary Cases
   - Security & Authentication (SQLi, XSS, Token validation)
   - Performance & Load Testing
3. **Flexible Output Formats**:
   - **BDD / Gherkin** (`Given - When - Then`) syntax for Cucumber/SpecFlow automation.
   - **Structured Markdown Table** for easy Jira/Confluence pasting.
   - **JSON Schema** for integration with automated test runners.
4. **Interactive Test Workspace**:
   - Color-coded priority badges (**P1 - Critical**, **P2 - High**, **P3 - Medium**).
   - Test execution status toggles (`Draft`, `Passed`, `Failed`).
   - Live search filter by title or priority level.
   - 1-Click Clipboard Copy, JSON file export, and Print-to-PDF ready.
5. **Persistence & Portability**:
   - Full LocalStorage session history with timestamps and instant restoration.
   - 100% Client-side execution — Zero tracking, private, and offline-capable.

---

## 🏗️ Prompt Engineering Architecture (3-Layer Methodology)
This project was designed, generated, and iteratively refined using the **IBM Bob 3-Layer Prompting Framework**:

### Layer 1: Role & Context
> *"Act as a Senior QA Automation Lead and Principal Frontend Engineer participating in the IBM SkillsBuild IT Capstone Challenge. Your mission is to build a production-grade, enterprise-ready web application called 'AI Test Case Generator' for modern software engineering teams."*

### Layer 2: Task & Requirements
Detailed specification of core features: input parsing of PRD requirements, deterministic rule-based synthesis engine, test case metadata (Test ID, Preconditions, Action Steps, Expected Result, Priority), workspace management, export capabilities, and LocalStorage history.

### Layer 3: Constraints & Visual Output
Modular 3-file architecture (`index.html`, `style.css`, `script.js`), Vanilla JS (ES6+), Tailwind CSS CDN, WCAG AA compliance, and IBM Carbon Design aesthetic (`#0f62fe` primary accents).

### 🔄 Targeted Iteration (Design Refinement)
Applied Layer 3 refinement to elevate standard boxy UI elements into an ultra-modern SaaS design:
- Replaced rigid rectangles with **`rounded-2xl`** and **`rounded-xl`** surfaces.
- Implemented **glassmorphism** with soft ambient shadows and subtle backdrop blur.
- Styled pill-shaped filter controls and micro-interaction hover transitions.

---

## 🛠️ Technology Stack
- **Markup**: Semantic HTML5 (Accessible landmarks & ARIA compliance)
- **Styling**: Tailwind CSS (Utility classes) + Custom CSS Variables (`style.css`)
- **Logic**: Vanilla JavaScript (ES6+, Functional Architecture, LocalStorage API)
- **Design System**: Inspired by IBM Carbon Design System & Modern Enterprise SaaS

---

## 📂 Project Structure
```text
capstone-testcase/
├── index.html        # Semantic HTML5 layout, input panels, and modals
├── style.css         # Design tokens, IBM Carbon theme, glassmorphism, animations
├── script.js         # Core parsing engine, generator logic, and state management
└── README.md         # Project documentation and developer credentials
```

---

## 🚀 Getting Started Locally

### Quick Run
1. Clone this repository:
   ```bash
   git clone https://github.com/muhmdathalla/capstone-testcase.git
   ```
2. Navigate into the directory:
   ```bash
   cd capstone-testcase
   ```
3. Open `index.html` in your favorite modern web browser:
   - On Windows: Dobel-klik `index.html` atau jalankan via Live Server di VS Code / IBM Bob.

---

## 🔮 Future Roadmap (Optional Potential Developments)
- [ ] Direct two-way sync with Jira & GitHub Issues API.
- [ ] Auto-generation of executable Cypress / Playwright test spec files.
- [ ] Integration with IBM watsonx.ai API for semantic understanding of large PDF documents.

---

## 📜 License & Acknowledgments
Distributed under the MIT License. Developed as part of the **IBM SkillsBuild x Hacktiv8** program.  
Special thanks to the instructors and mentors from Hacktiv8 and IBM.
