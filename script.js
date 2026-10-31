/**
 * @fileoverview AI Test Case Generator — Core Application Script
 * @description Deterministic client-side test suite generation engine with
 *   LocalStorage history, live search/filter, multi-format export, and
 *   full accessibility support.
 * @version 1.0.0
 * @author IBM SkillsBuild Capstone
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ═══════════════════════════════════════════════════════════ */

/** @type {string} LocalStorage key for history entries */
const LS_KEY = 'atcg_history';

/** @type {number} Maximum history entries to retain */
const MAX_HISTORY = 20;

/**
 * Functional verbs that trigger test case extraction.
 * @type {string[]}
 */
const FUNCTIONAL_VERBS = [
  'login','log in','sign in','register','sign up','logout','sign out',
  'submit','upload','download','delete','remove','create','add','update',
  'edit','modify','search','filter','sort','export','import','view','display',
  'validate','verify','confirm','approve','reject','send','receive',
  'pay','checkout','purchase','cancel','reset','refresh','load',
  'navigate','redirect','access','authenticate','authorize','encrypt','decrypt',
  'paginate','scroll','click','select','toggle','open','close',
];

/**
 * Boundary/condition keywords for edge-case extraction.
 * @type {string[]}
 */
const BOUNDARY_KEYWORDS = [
  'minimum','maximum','min','max','limit','boundary','empty','null',
  'invalid','valid','required','optional','exceed','overflow','timeout',
  'expired','duplicate','unique','special character','whitespace',
  'uppercase','lowercase','numeric','alphanumeric','sql injection','xss',
  'concurrent','parallel','large file','file size','threshold',
];

/**
 * Security-specific test patterns.
 * @type {Array<{pattern: string, title: string, desc: string}>}
 */
const SECURITY_PATTERNS = [
  { pattern: 'sql',        title: 'SQL Injection Prevention',          desc: 'Attempt SQL injection via input fields' },
  { pattern: 'xss',        title: 'Cross-Site Scripting (XSS)',        desc: 'Inject script tags into user-controlled fields' },
  { pattern: 'auth',       title: 'Authentication Bypass',             desc: 'Attempt to bypass login without valid credentials' },
  { pattern: 'token',      title: 'JWT / Session Token Validation',    desc: 'Verify expired or tampered tokens are rejected' },
  { pattern: 'brute',      title: 'Brute Force Rate Limiting',         desc: 'Exceed max login attempts and verify lockout' },
  { pattern: 'csrf',       title: 'CSRF Token Enforcement',            desc: 'Submit state-changing request without CSRF token' },
  { pattern: 'privilege',  title: 'Privilege Escalation Check',        desc: 'Access admin endpoints as a standard user' },
  { pattern: 'password',   title: 'Weak Password Rejection',           desc: 'Submit passwords not meeting complexity rules' },
];

/**
 * Performance-specific test patterns.
 * @type {Array<{title: string, desc: string, steps: string[]}>}
 */
const PERFORMANCE_PATTERNS = [
  {
    title: 'Load Test — Baseline Throughput',
    desc:  'Verify system handles expected normal load within SLA.',
    steps: ['Simulate 100 concurrent users','Measure average response time','Assert p95 < 500ms'],
  },
  {
    title: 'Stress Test — Peak Concurrency',
    desc:  'Push system beyond normal capacity to find breaking point.',
    steps: ['Ramp to 1000 concurrent users','Monitor error rate & CPU','Record failure threshold'],
  },
  {
    title: 'Endurance Test — Memory Leak Detection',
    desc:  'Run sustained traffic over 30 minutes to detect memory leaks.',
    steps: ['Apply 50 concurrent users for 30 min','Sample heap memory every 5 min','Assert no steady growth'],
  },
  {
    title: 'Spike Test — Sudden Traffic Surge',
    desc:  'Instantly ramp from 10 to 500 users and verify recovery.',
    steps: ['Warm-up at 10 users for 1 min','Spike to 500 users for 30s','Assert graceful degradation'],
  },
];

/* ═══════════════════════════════════════════════════════════
   APPLICATION STATE
   ═══════════════════════════════════════════════════════════ */

/**
 * @typedef {Object} TestCase
 * @property {string}   id           - Unique test ID (TC-001)
 * @property {string}   title        - Short descriptive title
 * @property {string}   description  - Full description of what is tested
 * @property {string}   preconditions
 * @property {string[]} steps        - Ordered list of execution steps
 * @property {string}   expected     - Expected result
 * @property {'P1'|'P2'|'P3'} priority
 * @property {'draft'|'passed'|'failed'} status
 * @property {string}   format       - Output format key
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string}     id         - Unique history ID
 * @property {string}     name       - Short display name
 * @property {string}     timestamp  - ISO timestamp
 * @property {TestCase[]} cases
 * @property {string}     type       - Testing type
 * @property {string}     format     - Output format
 */

/** @type {TestCase[]} Currently displayed test cases */
let currentCases = [];

/** @type {string} Active priority filter ('all' | 'P1' | 'P2' | 'P3') */
let activeFilter = 'all';

/** @type {string} Current search term */
let searchTerm = '';

/* ═══════════════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

const DOM = {
  requirementsInput:  $('requirements-input'),
  testingType:        $('testing-type'),
  outputFormat:       $('output-format'),
  btnGenerate:        $('btn-generate'),
  btnGenerateText:    $('btn-generate-text'),
  btnGenerateSpinner: $('btn-generate-spinner'),
  btnClear:           $('btn-clear'),
  btnHistoryToggle:   $('btn-history-toggle'),
  btnHistoryClose:    $('btn-history-close'),
  btnThemeToggle:     $('btn-theme-toggle'),
  iconSun:            $('icon-sun'),
  iconMoon:           $('icon-moon'),
  historyDrawer:      $('history-drawer'),
  drawerOverlay:      $('drawer-overlay'),
  historyList:        $('history-list'),
  historyEmpty:       $('history-empty'),
  resultsEmpty:       $('results-empty'),
  noFilterResults:    $('no-filter-results'),
  testCardsContainer: $('test-cards-container'),
  statsBar:           $('stats-bar'),
  statTotal:          $('stat-total'),
  statP1:             $('stat-p1'),
  statP2:             $('stat-p2'),
  statP3:             $('stat-p3'),
  statPassed:         $('stat-passed'),
  statFailed:         $('stat-failed'),
  searchInput:        $('search-input'),
  btnCopyMd:          $('btn-copy-md'),
  btnExportJson:      $('btn-export-json'),
  btnPrint:           $('btn-print'),
  toastContainer:     $('toast-container'),
};

/* ═══════════════════════════════════════════════════════════
   UTILITY HELPERS
   ═══════════════════════════════════════════════════════════ */

/**
 * Generate a short UUID-like unique ID.
 * @returns {string}
 */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Pad a number to a minimum width with leading zeros.
 * @param {number} n
 * @param {number} [width=3]
 * @returns {string}
 */
function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}

/**
 * Format a Date as a human-readable timestamp string.
 * @param {Date} [date]
 * @returns {string}
 */
function formatTimestamp(date = new Date()) {
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════ */

/**
 * Show a brief notification toast.
 * @param {string} message
 * @param {'info'|'success'|'error'} [type='info']
 * @param {number} [duration=3000]
 */
function showToast(message, type = 'info', duration = 3000) {
  const icons = {
    info:    `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>`,
    success: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>`,
    error:   `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">${icons[type]}</svg>
    <span>${escapeHtml(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ═══════════════════════════════════════════════════════════
   AI SIMULATION ENGINE — CORE GENERATOR
   ═══════════════════════════════════════════════════════════ */

/**
 * Extract meaningful action phrases from raw requirements text.
 * Uses verb-scanning and sentence segmentation.
 * @param {string} text - Raw requirements input
 * @returns {string[]} Array of extracted action phrases
 */
function extractActionPhrases(text) {
  const sentences = text
    .split(/[.\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const phrases = new Set();

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const verb of FUNCTIONAL_VERBS) {
      if (lower.includes(verb)) {
        phrases.add(sentence);
        break;
      }
    }
    // Also pick up "must", "should", "shall" requirement sentences
    if (/\b(must|should|shall|need to|needs to)\b/i.test(sentence)) {
      phrases.add(sentence);
    }
  }

  // Fallback: use all non-trivial sentences if nothing matched
  if (phrases.size === 0) {
    sentences.slice(0, 6).forEach(s => phrases.add(s));
  }

  return [...phrases].slice(0, 12);
}

/**
 * Determine priority based on keywords in the phrase.
 * @param {string} phrase
 * @param {number} index
 * @returns {'P1'|'P2'|'P3'}
 */
function derivePriority(phrase, index) {
  const lower = phrase.toLowerCase();
  if (/\b(login|auth|payment|checkout|security|critical|password|token|access)\b/.test(lower)) return 'P1';
  if (/\b(submit|validate|upload|create|delete|update|export|search)\b/.test(lower)) return 'P2';
  return index % 3 === 0 ? 'P1' : index % 3 === 1 ? 'P2' : 'P3';
}

/**
 * Build preconditions string from phrase context.
 * @param {string} phrase
 * @param {string} testingType
 * @returns {string}
 */
function buildPreconditions(phrase, testingType) {
  const lower = phrase.toLowerCase();
  const parts = ['Application is running and accessible'];

  if (/\b(login|auth|user|account|session)\b/.test(lower)) {
    parts.push('User account exists in the system');
  }
  if (/\b(admin|role|permission|privilege)\b/.test(lower)) {
    parts.push('Admin role is assigned to the test account');
  }
  if (/\b(upload|file|image|document)\b/.test(lower)) {
    parts.push('Test files are available in the test data directory');
  }
  if (/\b(api|endpoint|request|response)\b/.test(lower)) {
    parts.push('API environment is configured with valid base URL and headers');
  }
  if (testingType === 'performance') {
    parts.push('Performance monitoring tools are attached (APM / profiler)');
  }
  if (testingType === 'security') {
    parts.push('Test environment is isolated from production data');
  }

  return parts.join('; ');
}

/**
 * Generate ordered execution steps for a test case phrase.
 * @param {string} phrase
 * @param {string} testingType
 * @returns {string[]}
 */
function buildSteps(phrase, testingType) {
  const lower = phrase.toLowerCase();
  const steps = ['Open the application in a supported browser / client'];

  if (/\b(login|sign in|log in|authenticate)\b/.test(lower)) {
    steps.push(
      'Navigate to the login / authentication page',
      'Enter valid credentials (username and password)',
      'Click the "Login" or "Sign In" button',
    );
  } else if (/\b(register|sign up|create account)\b/.test(lower)) {
    steps.push(
      'Navigate to the registration page',
      'Fill in all required fields with valid test data',
      'Accept terms and conditions if prompted',
      'Click the "Register" button',
    );
  } else if (/\b(upload)\b/.test(lower)) {
    steps.push(
      'Navigate to the file upload section',
      'Click "Choose File" or drag a test file to the drop zone',
      'Select a file matching the described criteria',
      'Confirm or submit the upload',
    );
  } else if (/\b(search|filter)\b/.test(lower)) {
    steps.push(
      'Navigate to the search or filter interface',
      'Enter a valid search term or apply filter criteria',
      'Submit the search / apply the filter',
    );
  } else if (/\b(delete|remove)\b/.test(lower)) {
    steps.push(
      'Navigate to the target resource',
      'Select the item to be deleted',
      'Click the "Delete" or "Remove" action',
      'Confirm the deletion in the confirmation dialog',
    );
  } else if (/\b(export|download)\b/.test(lower)) {
    steps.push(
      'Navigate to the data or report section',
      'Click the "Export" or "Download" button',
      'Select export format if applicable',
    );
  } else {
    // Generic steps derived from the phrase itself
    const verb = FUNCTIONAL_VERBS.find(v => lower.includes(v)) || 'perform the action';
    steps.push(
      `Navigate to the relevant page or section`,
      `${capitalize(verb)} as described in the requirement`,
      'Observe the system response',
    );
  }

  if (testingType === 'edge') {
    steps.push('Repeat the above with boundary / invalid input data');
  }

  steps.push('Capture screenshots or logs if deviations are observed');
  return steps;
}

/**
 * Build the expected result string for a phrase.
 * @param {string} phrase
 * @param {string} testingType
 * @returns {string}
 */
function buildExpected(phrase, testingType) {
  const lower = phrase.toLowerCase();

  if (testingType === 'security') {
    return 'System rejects the malicious or unauthorized input with an appropriate error message and logs the event. No sensitive data is exposed.';
  }
  if (testingType === 'performance') {
    return 'Response time is within acceptable SLA thresholds. No degradation, memory leaks, or error rate spikes are observed under the defined load.';
  }
  if (/\b(login|sign in|authenticate)\b/.test(lower)) {
    return 'User is successfully authenticated, redirected to the dashboard, and a valid session token is issued.';
  }
  if (/\b(register|sign up)\b/.test(lower)) {
    return 'User account is created successfully. Confirmation email is sent. User is redirected to onboarding or login page.';
  }
  if (/\b(upload)\b/.test(lower)) {
    return 'File is uploaded, validated, and stored. A success confirmation is displayed with the file name and size.';
  }
  if (/\b(delete|remove)\b/.test(lower)) {
    return 'The resource is permanently removed. The UI reflects the deletion immediately and no orphaned records remain.';
  }
  if (/\b(search|filter)\b/.test(lower)) {
    return 'Results are accurate, sorted correctly, and rendered within 500 ms. No irrelevant records are shown.';
  }
  if (/\b(export|download)\b/.test(lower)) {
    return 'A file is downloaded in the expected format. Contents match the on-screen data without corruption.';
  }
  return 'The system processes the action successfully, displays an appropriate confirmation or result, and updates the state without errors.';
}

/**
 * Generate a short, descriptive title for a test case.
 * @param {string} phrase
 * @param {string} testingType
 * @param {number} index
 * @returns {string}
 */
function buildTitle(phrase, testingType, index) {
  const prefixes = {
    functional:   ['Verify','Validate','Confirm','Assert','Test'],
    edge:         ['Edge Case —','Boundary Check —','Invalid Input —','Null/Empty —','Overflow —'],
    security:     ['Security —','Auth Check —','Injection Test —','Access Control —','Vulnerability —'],
    performance:  ['Perf —','Load Check —','Stress Test —','Latency —','Throughput —'],
  };

  const prefix = (prefixes[testingType] || prefixes.functional)[index % 5];

  // Extract key noun phrase (up to 6 words) from the requirement sentence
  const words = phrase.replace(/^(as a user,?|i want to|so that)\s*/i, '').split(/\s+/);
  const snippet = words.slice(0, 7).join(' ');

  return `${prefix} ${capitalize(snippet)}`;
}

/**
 * Generate description for a test case.
 * @param {string} phrase
 * @param {string} testingType
 * @returns {string}
 */
function buildDescription(phrase, testingType) {
  const typeLabels = {
    functional:  'functional correctness of',
    edge:        'edge-case and boundary behaviour of',
    security:    'security posture and resilience of',
    performance: 'performance characteristics of',
  };
  const label = typeLabels[testingType] || 'behaviour of';
  return `This test verifies the ${label}: "${phrase.trim()}"`;
}

/**
 * Main deterministic AI simulation engine.
 * Parses requirements text and produces a structured test suite.
 * @param {string} requirementsText  - Raw requirements input
 * @param {string} testingType       - Selected testing type
 * @param {string} outputFormat      - Selected output format key
 * @returns {TestCase[]}
 */
function generateTestCases(requirementsText, testingType, outputFormat) {
  /** @type {TestCase[]} */
  const cases = [];
  let counter = 1;

  // ── Performance: add fixed patterns + requirement-derived cases ──
  if (testingType === 'performance') {
    for (const pattern of PERFORMANCE_PATTERNS) {
      cases.push({
        id:           `TC-${pad(counter++)}`,
        title:        pattern.title,
        description:  pattern.desc,
        preconditions: 'Performance test environment is set up. APM tool is attached. Test data is pre-seeded.',
        steps:        pattern.steps,
        expected:     'All assertions pass within defined SLA thresholds with no anomalies.',
        priority:     counter <= 3 ? 'P1' : 'P2',
        status:       'draft',
        format:       outputFormat,
      });
    }
  }

  // ── Security: add pattern-matched cases ──
  if (testingType === 'security') {
    const lower = requirementsText.toLowerCase();
    for (const sp of SECURITY_PATTERNS) {
      // Include security case if its pattern keyword appears, or include all for generic text
      if (lower.includes(sp.pattern) || cases.length < 3) {
        cases.push({
          id:           `TC-${pad(counter++)}`,
          title:        sp.title,
          description:  sp.desc,
          preconditions: 'Test environment isolated. WAF disabled for injection tests. Valid test accounts available.',
          steps: [
            'Set up test payload for the attack vector',
            `Execute the ${sp.title} scenario against the target endpoint`,
            'Capture the system response, HTTP status, and server logs',
            'Verify that no sensitive data is leaked',
          ],
          expected: 'Attack is blocked, appropriate error returned (e.g., 400/401/403). No sensitive data exposed. Event is logged.',
          priority: 'P1',
          status:   'draft',
          format:   outputFormat,
        });
      }
    }
  }

  // ── Extract action phrases and build test cases ──
  const phrases = extractActionPhrases(requirementsText);

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    const priority = derivePriority(phrase, i);

    // Core happy-path test
    cases.push({
      id:           `TC-${pad(counter++)}`,
      title:        buildTitle(phrase, testingType, i),
      description:  buildDescription(phrase, testingType),
      preconditions: buildPreconditions(phrase, testingType),
      steps:        buildSteps(phrase, testingType),
      expected:     buildExpected(phrase, testingType),
      priority,
      status:       'draft',
      format:       outputFormat,
    });

    // Edge cases: generate a negative / boundary variant
    if (testingType === 'edge' || testingType === 'functional') {
      const boundaryMatch = BOUNDARY_KEYWORDS.find(k => phrase.toLowerCase().includes(k));
      const boundaryLabel = boundaryMatch || 'invalid data';

      cases.push({
        id:           `TC-${pad(counter++)}`,
        title:        `Negative — ${buildTitle(phrase, 'edge', i + 1)}`,
        description:  `Verifies system handles ${boundaryLabel} gracefully: "${phrase.trim()}"`,
        preconditions: buildPreconditions(phrase, testingType),
        steps: [
          ...buildSteps(phrase, testingType).slice(0, -1),
          `Replace valid input with ${boundaryLabel}`,
          'Submit / trigger the action',
          'Observe error handling and messaging',
        ],
        expected: 'System displays a clear, user-friendly validation error. No crash, data loss, or stack trace is exposed.',
        priority: priority === 'P1' ? 'P1' : 'P2',
        status:   'draft',
        format:   outputFormat,
      });
    }
  }

  // Ensure at least 3 cases even for very short input
  if (cases.length === 0) {
    for (let i = 0; i < 3; i++) {
      cases.push({
        id:           `TC-${pad(counter++)}`,
        title:        `General Test Case ${i + 1}`,
        description:  'Auto-generated test for the provided requirement.',
        preconditions: 'Application is running and accessible.',
        steps:        ['Open application', 'Perform the described action', 'Verify the outcome'],
        expected:     'System responds as described in the requirement without errors.',
        priority:     (['P1','P2','P3'])[i],
        status:       'draft',
        format:       outputFormat,
      });
    }
  }

  return cases;
}

/* ═══════════════════════════════════════════════════════════
   FORMAT RENDERERS
   ═══════════════════════════════════════════════════════════ */

/**
 * Render a single TestCase as BDD / Gherkin feature text.
 * @param {TestCase} tc
 * @returns {string}
 */
function renderBDD(tc) {
  const scenario = tc.steps.map((s, i) => {
    const keyword = i === 0 ? 'Given' : i === 1 ? 'When' : 'And';
    return `    ${keyword} ${s}`;
  }).join('\n');

  return [
    `Feature: ${tc.title}`,
    ``,
    `  # ${tc.description}`,
    `  # Priority: ${tc.priority} | Status: ${tc.status}`,
    `  # Preconditions: ${tc.preconditions}`,
    ``,
    `  Scenario: ${tc.id} — ${tc.title}`,
    scenario,
    `    Then ${tc.expected}`,
  ].join('\n');
}

/**
 * Render all test cases as a Markdown table.
 * @param {TestCase[]} cases
 * @returns {string}
 */
function renderTable(cases) {
  const header = `| ID | Title | Priority | Status | Preconditions | Expected Result |`;
  const sep    = `|---|---|---|---|---|---|`;
  const rows   = cases.map(tc =>
    `| ${tc.id} | ${tc.title} | ${tc.priority} | ${capitalize(tc.status)} | ${tc.preconditions} | ${tc.expected} |`
  );
  return [header, sep, ...rows].join('\n');
}

/**
 * Render all test cases as a JSON schema string.
 * @param {TestCase[]} cases
 * @returns {string}
 */
function renderJSON(cases) {
  return JSON.stringify({
    $schema:   'https://atcg.ibm.example/schema/test-suite/v1',
    generated: new Date().toISOString(),
    count:     cases.length,
    testCases: cases.map(tc => ({
      id:           tc.id,
      title:        tc.title,
      description:  tc.description,
      preconditions: tc.preconditions,
      steps:        tc.steps,
      expectedResult: tc.expected,
      priority:     tc.priority,
      status:       tc.status,
    })),
  }, null, 2);
}

/**
 * Render a suite to a Markdown string (for Copy MD button).
 * @param {TestCase[]} cases
 * @returns {string}
 */
function renderMarkdown(cases) {
  const lines = [
    `# AI-Generated Test Suite`,
    `Generated: ${formatTimestamp()}  `,
    `Total Cases: ${cases.length}`,
    '',
  ];

  for (const tc of cases) {
    lines.push(
      `---`,
      `## ${tc.id}: ${tc.title}`,
      `**Priority:** ${tc.priority} | **Status:** ${capitalize(tc.status)}`,
      '',
      `**Description:** ${tc.description}`,
      '',
      `**Preconditions:** ${tc.preconditions}`,
      '',
      `**Steps:**`,
      ...tc.steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      `**Expected Result:** ${tc.expected}`,
      '',
    );
  }

  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════
   CARD RENDERING
   ═══════════════════════════════════════════════════════════ */

/**
 * Build the inner HTML for a single BDD-formatted card body section.
 * @param {TestCase} tc
 * @returns {string}
 */
function buildCardBodyHTML(tc) {
  const stepsHtml = tc.steps
    .map(s => `<li>${escapeHtml(s)}</li>`)
    .join('');

  if (tc.format === 'bdd') {
    const bddLines = tc.steps.map((s, i) => {
      const kw = i === 0 ? 'Given' : i === 1 ? 'When' : 'And';
      return `<div class="card-section-text" style="font-family:'IBM Plex Mono',monospace;font-size:.76rem;"><strong style="color:var(--ibm-blue)">${kw}</strong> ${escapeHtml(s)}</div>`;
    }).join('');

    return `
      <div class="card-section">
        <div class="card-section-label">Description</div>
        <div class="card-section-text">${escapeHtml(tc.description)}</div>
      </div>
      <div class="card-section">
        <div class="card-section-label">Preconditions</div>
        <div class="card-section-text">${escapeHtml(tc.preconditions)}</div>
      </div>
      <div class="card-section">
        <div class="card-section-label">Scenario (Given / When / Then)</div>
        ${bddLines}
        <div class="card-section-text" style="font-family:'IBM Plex Mono',monospace;font-size:.76rem;margin-top:4px"><strong style="color:var(--ibm-blue)">Then</strong> ${escapeHtml(tc.expected)}</div>
      </div>`;
  }

  if (tc.format === 'json') {
    const snippet = JSON.stringify({ id: tc.id, priority: tc.priority, steps: tc.steps.length }, null, 2);
    return `
      <div class="card-section">
        <div class="card-section-label">Description</div>
        <div class="card-section-text">${escapeHtml(tc.description)}</div>
      </div>
      <div class="card-section">
        <div class="card-section-label">Preconditions</div>
        <div class="card-section-text">${escapeHtml(tc.preconditions)}</div>
      </div>
      <div class="card-section">
        <div class="card-section-label">JSON Preview</div>
        <pre style="font-family:'IBM Plex Mono',monospace;font-size:.72rem;background:var(--bg-surface);border:1px solid var(--border);border-radius:4px;padding:8px;overflow-x:auto;white-space:pre-wrap;color:var(--text-secondary)">${escapeHtml(snippet)}</pre>
      </div>
      <div class="card-section">
        <div class="card-section-label">Expected Result</div>
        <div class="card-section-text">${escapeHtml(tc.expected)}</div>
      </div>`;
  }

  // Default: Structured Table / Standard
  return `
    <div class="card-section">
      <div class="card-section-label">Description</div>
      <div class="card-section-text">${escapeHtml(tc.description)}</div>
    </div>
    <div class="card-section">
      <div class="card-section-label">Preconditions</div>
      <div class="card-section-text">${escapeHtml(tc.preconditions)}</div>
    </div>
    <div class="card-section">
      <div class="card-section-label">Steps</div>
      <ol class="card-steps-list">${stepsHtml}</ol>
    </div>
    <div class="card-section">
      <div class="card-section-label">Expected Result</div>
      <div class="card-section-text">${escapeHtml(tc.expected)}</div>
    </div>`;
}

/**
 * Create and return a DOM element for a test case card.
 * @param {TestCase} tc
 * @returns {HTMLElement}
 */
function createCardElement(tc) {
  const article = document.createElement('article');
  article.className = 'test-card';
  article.setAttribute('data-id', tc.id);
  article.setAttribute('data-priority', tc.priority);
  article.setAttribute('data-status', tc.status);
  article.setAttribute('data-title', tc.title.toLowerCase());
  article.setAttribute('role', 'listitem');
  article.setAttribute('aria-label', `Test case ${tc.id}: ${tc.title}`);

  article.innerHTML = `
    <div class="card-header">
      <span class="card-id">${escapeHtml(tc.id)}</span>
      <div class="card-badges">
        <span class="priority-badge priority-badge--${tc.priority}" aria-label="Priority ${tc.priority}">${tc.priority}</span>
      </div>
    </div>
    <h3 class="card-title">${escapeHtml(tc.title)}</h3>
    <div class="card-body card-body-collapsed" id="card-body-${tc.id}">
      ${buildCardBodyHTML(tc)}
    </div>
    <button class="card-expand-btn" aria-expanded="false" aria-controls="card-body-${tc.id}" data-card-id="${tc.id}">
      Show more
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
    </button>
    <div class="card-footer">
      <label for="status-${tc.id}" class="sr-only">Status for ${tc.id}</label>
      <select id="status-${tc.id}" class="status-select" data-status="${tc.status}" data-card-id="${tc.id}" aria-label="Status for test case ${tc.id}">
        <option value="draft"  ${tc.status === 'draft'  ? 'selected' : ''}>📝 Draft</option>
        <option value="passed" ${tc.status === 'passed' ? 'selected' : ''}>✅ Passed</option>
        <option value="failed" ${tc.status === 'failed' ? 'selected' : ''}>❌ Failed</option>
      </select>
      <button class="card-copy-btn" data-card-id="${tc.id}" aria-label="Copy ${tc.id} to clipboard" title="Copy this test case">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>
      </button>
    </div>`;

  return article;
}

/* ═══════════════════════════════════════════════════════════
   WORKSPACE RENDER & FILTER
   ═══════════════════════════════════════════════════════════ */

/**
 * Compute filtered subset of currentCases based on activeFilter + searchTerm.
 * @returns {TestCase[]}
 */
function getFilteredCases() {
  return currentCases.filter(tc => {
    const matchesPriority = activeFilter === 'all' || tc.priority === activeFilter;
    const matchesSearch   = !searchTerm ||
      tc.title.toLowerCase().includes(searchTerm) ||
      tc.id.toLowerCase().includes(searchTerm) ||
      tc.description.toLowerCase().includes(searchTerm);
    return matchesPriority && matchesSearch;
  });
}

/**
 * Re-render the cards container with the current filtered cases.
 */
function renderCards() {
  const filtered = getFilteredCases();

  // Show/hide states
  const hasAnyCases  = currentCases.length > 0;
  const hasFiltered  = filtered.length > 0;

  DOM.resultsEmpty.hidden    = hasAnyCases;
  DOM.statsBar.hidden        = !hasAnyCases;
  DOM.noFilterResults.hidden = !hasAnyCases || hasFiltered;

  // Enable/disable export buttons
  [DOM.btnCopyMd, DOM.btnExportJson, DOM.btnPrint].forEach(btn => {
    btn.disabled = !hasAnyCases;
  });

  // Clear and re-populate cards
  DOM.testCardsContainer.innerHTML = '';
  if (hasFiltered) {
    const fragment = document.createDocumentFragment();
    filtered.forEach((tc, i) => {
      const card = createCardElement(tc);
      card.style.animationDelay = `${i * 40}ms`;
      fragment.appendChild(card);
    });
    DOM.testCardsContainer.appendChild(fragment);
  }

  updateStats();
}

/**
 * Update the stats bar counters.
 */
function updateStats() {
  const all    = currentCases;
  const p1     = all.filter(tc => tc.priority === 'P1').length;
  const p2     = all.filter(tc => tc.priority === 'P2').length;
  const p3     = all.filter(tc => tc.priority === 'P3').length;
  const passed = all.filter(tc => tc.status   === 'passed').length;
  const failed = all.filter(tc => tc.status   === 'failed').length;

  DOM.statTotal.textContent  = `Total: ${all.length}`;
  DOM.statP1.textContent     = `P1: ${p1}`;
  DOM.statP2.textContent     = `P2: ${p2}`;
  DOM.statP3.textContent     = `P3: ${p3}`;
  DOM.statPassed.textContent = `✅ ${passed}`;
  DOM.statFailed.textContent = `❌ ${failed}`;
}

/* ═══════════════════════════════════════════════════════════
   LOCALSTORAGE — HISTORY
   ═══════════════════════════════════════════════════════════ */

/**
 * Load history array from LocalStorage.
 * @returns {HistoryEntry[]}
 */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Save history array to LocalStorage.
 * @param {HistoryEntry[]} history
 */
function saveHistory(history) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // Storage quota exceeded — silently skip
  }
}

/**
 * Add a new entry to LocalStorage history.
 * @param {TestCase[]} cases
 * @param {string} requirementsText
 * @param {string} testingType
 * @param {string} outputFormat
 */
function addHistoryEntry(cases, requirementsText, testingType, outputFormat) {
  const history = loadHistory();
  const snippet = requirementsText.trim().split(/\s+/).slice(0, 8).join(' ');
  const name    = snippet.length > 60 ? snippet.slice(0, 57) + '…' : snippet;

  /** @type {HistoryEntry} */
  const entry = {
    id:        uid(),
    name:      name || 'Untitled Suite',
    timestamp: new Date().toISOString(),
    cases,
    type:      testingType,
    format:    outputFormat,
  };

  history.unshift(entry);
  saveHistory(history);
  renderHistory();
}

/**
 * Render the history sidebar list from LocalStorage.
 */
function renderHistory() {
  const history = loadHistory();
  DOM.historyList.innerHTML = '';

  if (history.length === 0) {
    DOM.historyEmpty.hidden = false;
    return;
  }

  DOM.historyEmpty.hidden = true;

  const typeIcons = { functional: '⚙️', edge: '⚠️', security: '🔒', performance: '🚀' };

  history.forEach(entry => {
    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <div class="history-item" data-entry-id="${escapeHtml(entry.id)}" role="button" tabindex="0" aria-label="Load suite: ${escapeHtml(entry.name)}">
        <div class="history-item-body">
          <span class="history-item-name">${typeIcons[entry.type] || '📋'} ${escapeHtml(entry.name)}</span>
          <span class="history-item-meta">${formatTimestamp(new Date(entry.timestamp))} · ${entry.cases.length} cases</span>
        </div>
        <button class="history-item-del" data-del-id="${escapeHtml(entry.id)}" aria-label="Delete history entry: ${escapeHtml(entry.name)}" title="Delete">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 6a1 1 0 112 0v5a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v5a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
        </button>
      </div>`;

    DOM.historyList.appendChild(li);
  });
}

/**
 * Load a history entry into the workspace.
 * @param {string} entryId
 */
function loadHistoryEntry(entryId) {
  const history = loadHistory();
  const entry   = history.find(h => h.id === entryId);
  if (!entry) return;

  currentCases = entry.cases;
  activeFilter = 'all';
  searchTerm   = '';
  DOM.searchInput.value = '';
  setFilterButton('all');
  renderCards();
  showToast(`Loaded "${entry.name}" (${entry.cases.length} cases)`, 'success');
  closeHistoryDrawer();
}

/**
 * Delete a history entry by ID.
 * @param {string} entryId
 * @param {Event} event
 */
function deleteHistoryEntry(entryId, event) {
  event.stopPropagation();
  const history = loadHistory().filter(h => h.id !== entryId);
  saveHistory(history);
  renderHistory();
  showToast('History entry deleted.', 'info');
}

/* ═══════════════════════════════════════════════════════════
   EXPORT FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

/**
 * Copy test suite as Markdown to clipboard.
 */
async function copyMarkdown() {
  if (!currentCases.length) return;
  const md = currentCases[0].format === 'table'
    ? renderTable(currentCases)
    : currentCases[0].format === 'json'
      ? renderJSON(currentCases)
      : renderMarkdown(currentCases);

  try {
    await navigator.clipboard.writeText(md);
    showToast('Copied to clipboard!', 'success');
  } catch {
    showToast('Failed to copy. Please try again.', 'error');
  }
}

/**
 * Trigger a JSON file download of the current test suite.
 */
function exportJSON() {
  if (!currentCases.length) return;
  const json = renderJSON(currentCases);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `test-suite-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('JSON file downloaded.', 'success');
}

/**
 * Open the browser print dialog (for PDF export).
 */
function printSuite() {
  if (!currentCases.length) return;
  window.print();
}

/* ═══════════════════════════════════════════════════════════
   GENERATE HANDLER
   ═══════════════════════════════════════════════════════════ */

/**
 * Handle the Generate Test Cases button click.
 * Validates input, runs the engine, and renders results.
 */
async function handleGenerate() {
  const text   = DOM.requirementsInput.value.trim();
  const type   = DOM.testingType.value;
  const format = DOM.outputFormat.value;

  if (!text) {
    showToast('Please enter at least one requirement.', 'error');
    DOM.requirementsInput.focus();
    return;
  }

  if (text.length < 15) {
    showToast('Requirements seem too short. Add more detail for better results.', 'error');
    DOM.requirementsInput.focus();
    return;
  }

  // Loading state
  DOM.btnGenerate.disabled        = true;
  DOM.btnGenerateText.textContent = 'Generating…';
  DOM.btnGenerateSpinner.hidden   = false;

  // Simulate brief async processing (realistic UX feedback)
  await new Promise(resolve => setTimeout(resolve, 420));

  try {
    const cases = generateTestCases(text, type, format);
    currentCases = cases;
    activeFilter = 'all';
    searchTerm   = '';
    DOM.searchInput.value = '';
    setFilterButton('all');

    renderCards();
    addHistoryEntry(cases, text, type, format);

    showToast(`Generated ${cases.length} test cases successfully!`, 'success');

    // Scroll results into view
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally {
    DOM.btnGenerate.disabled        = false;
    DOM.btnGenerateText.textContent = 'Generate Test Cases';
    DOM.btnGenerateSpinner.hidden   = true;
  }
}

/* ═══════════════════════════════════════════════════════════
   HISTORY DRAWER
   ═══════════════════════════════════════════════════════════ */

/** Open the history drawer. */
function openHistoryDrawer() {
  DOM.historyDrawer.classList.add('is-open');
  DOM.historyDrawer.setAttribute('aria-hidden', 'false');
  DOM.drawerOverlay.classList.add('is-visible');
  DOM.drawerOverlay.setAttribute('aria-hidden', 'false');
  DOM.btnHistoryToggle.setAttribute('aria-expanded', 'true');
  DOM.btnHistoryClose.focus();
}

/** Close the history drawer. */
function closeHistoryDrawer() {
  DOM.historyDrawer.classList.remove('is-open');
  DOM.historyDrawer.setAttribute('aria-hidden', 'true');
  DOM.drawerOverlay.classList.remove('is-visible');
  DOM.drawerOverlay.setAttribute('aria-hidden', 'true');
  DOM.btnHistoryToggle.setAttribute('aria-expanded', 'false');
  DOM.btnHistoryToggle.focus();
}

/** Toggle the history drawer open/closed. */
function toggleHistoryDrawer() {
  const isOpen = DOM.historyDrawer.classList.contains('is-open');
  isOpen ? closeHistoryDrawer() : openHistoryDrawer();
}

/* ═══════════════════════════════════════════════════════════
   THEME TOGGLE
   ═══════════════════════════════════════════════════════════ */

/**
 * Apply a theme to the document root.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  DOM.iconSun.classList.toggle('hidden', !isDark);
  DOM.iconMoon.classList.toggle('hidden', isDark);
  DOM.btnThemeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('atcg_theme', theme); } catch { /* ignore */ }
}

/** Toggle between light and dark theme. */
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}

/* ═══════════════════════════════════════════════════════════
   FILTER & SEARCH
   ═══════════════════════════════════════════════════════════ */

/**
 * Set the active filter button visual state.
 * @param {string} filter - 'all' | 'P1' | 'P2' | 'P3'
 */
function setFilterButton(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.setAttribute('aria-pressed', String(isActive));
    btn.classList.toggle('filter-btn--active', isActive && filter === 'all');
  });
}

/* ═══════════════════════════════════════════════════════════
   EVENT DELEGATION & LISTENERS
   ═══════════════════════════════════════════════════════════ */

/**
 * Wire up all event listeners using delegation where appropriate.
 */
function bindEvents() {
  // Generate button
  DOM.btnGenerate.addEventListener('click', handleGenerate);

  // Enter key on textarea
  DOM.requirementsInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
  });

  // Clear button
  DOM.btnClear.addEventListener('click', () => {
    DOM.requirementsInput.value = '';
    DOM.requirementsInput.focus();
  });

  // History toggle
  DOM.btnHistoryToggle.addEventListener('click', toggleHistoryDrawer);
  DOM.btnHistoryClose.addEventListener('click', closeHistoryDrawer);
  DOM.drawerOverlay.addEventListener('click', closeHistoryDrawer);

  // Escape key closes drawer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && DOM.historyDrawer.classList.contains('is-open')) {
      closeHistoryDrawer();
    }
  });

  // Theme toggle
  DOM.btnThemeToggle.addEventListener('click', toggleTheme);

  // Export buttons
  DOM.btnCopyMd.addEventListener('click', copyMarkdown);
  DOM.btnExportJson.addEventListener('click', exportJSON);
  DOM.btnPrint.addEventListener('click', printSuite);

  // Live search (debounced)
  let searchDebounce;
  DOM.searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchTerm = DOM.searchInput.value.trim().toLowerCase();
      renderCards();
    }, 200);
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      setFilterButton(activeFilter);
      renderCards();
    });
  });

  // Card container: delegated expand, status change, copy
  DOM.testCardsContainer.addEventListener('click', handleCardContainerClick);
  DOM.testCardsContainer.addEventListener('change', handleCardContainerChange);

  // History list: delegated load + delete
  DOM.historyList.addEventListener('click',   handleHistoryListClick);
  DOM.historyList.addEventListener('keydown', handleHistoryListKeydown);
}

/**
 * Handle click events within the test cards container.
 * @param {MouseEvent} e
 */
function handleCardContainerClick(e) {
  // Expand/collapse toggle
  const expandBtn = e.target.closest('.card-expand-btn');
  if (expandBtn) {
    const cardId  = expandBtn.dataset.cardId;
    const body    = document.getElementById(`card-body-${cardId}`);
    const isExp   = expandBtn.classList.contains('expanded');
    body.classList.toggle('card-body-collapsed', isExp);
    expandBtn.classList.toggle('expanded', !isExp);
    expandBtn.setAttribute('aria-expanded', String(!isExp));
    expandBtn.childNodes[0].textContent = isExp ? 'Show more' : 'Show less';
    return;
  }

  // Copy card
  const copyBtn = e.target.closest('.card-copy-btn');
  if (copyBtn) {
    const cardId = copyBtn.dataset.cardId;
    const tc     = currentCases.find(c => c.id === cardId);
    if (tc) {
      const md = renderMarkdown([tc]);
      navigator.clipboard.writeText(md)
        .then(() => showToast(`Copied ${cardId}!`, 'success'))
        .catch(() => showToast('Copy failed.', 'error'));
    }
  }
}

/**
 * Handle change events within the test cards container (status selects).
 * @param {Event} e
 */
function handleCardContainerChange(e) {
  const select = e.target.closest('.status-select');
  if (!select) return;

  const cardId    = select.dataset.cardId;
  const newStatus = select.value;
  const tc        = currentCases.find(c => c.id === cardId);
  if (!tc) return;

  tc.status = newStatus;
  select.dataset.status = newStatus;

  const card = DOM.testCardsContainer.querySelector(`[data-id="${cardId}"]`);
  if (card) card.setAttribute('data-status', newStatus);

  updateStats();
}

/**
 * Handle click in history list (load or delete).
 * @param {MouseEvent} e
 */
function handleHistoryListClick(e) {
  const delBtn = e.target.closest('[data-del-id]');
  if (delBtn) {
    deleteHistoryEntry(delBtn.dataset.delId, e);
    return;
  }
  const item = e.target.closest('[data-entry-id]');
  if (item) loadHistoryEntry(item.dataset.entryId);
}

/**
 * Handle keyboard navigation in history list.
 * @param {KeyboardEvent} e
 */
function handleHistoryListKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    const item = e.target.closest('[data-entry-id]');
    if (item) {
      e.preventDefault();
      loadHistoryEntry(item.dataset.entryId);
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════════════════════ */

/**
 * Bootstrap the application.
 * Restores theme, renders history, binds all events.
 */
function init() {
  // Restore theme preference
  const savedTheme = (() => {
    try { return localStorage.getItem('atcg_theme'); } catch { return null; }
  })();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  // Render history sidebar
  renderHistory();

  // Bind all events
  bindEvents();

  // Initial render (empty state)
  renderCards();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
