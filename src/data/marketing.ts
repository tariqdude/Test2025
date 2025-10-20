export interface Metric {
  value: string;
  label: string;
}

export interface Pillar {
  title: string;
  description: string;
}

export interface HighlightItem {
  label: string;
  title: string;
  description: string;
}

export interface SecurityPrinciple {
  indicator: string;
  title: string;
  description: string;
}

export interface SecuritySummary {
  intro: string;
  principles: SecurityPrinciple[];
}

export interface PlaybookStep {
  step: string;
  title: string;
  detail: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface EngagementTrack {
  name: string;
  timeline: string;
  summary: string;
  deliverables: string[];
}

export interface ControlStackItem {
  name: string;
  metric: string;
  metricLabel: string;
  summary: string;
  bullets: string[];
}

export interface InsightReport {
  category: string;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
}

export const heroSignals: string[] = [
  'Executive-ready readouts without live dashboards',
  'Compliance-friendly archives for every release cycle',
  'Zero-runtime components tuned for enterprise control',
];

export const clientBadges: string[] = [
  'Northwind Heavy',
  'Globex Systems',
  'Initech Logistics',
  'Starkline Group',
];

export const keyMetrics: Metric[] = [
  { value: '12 min', label: 'Average build to publish' },
  { value: '0 deps', label: 'Client frameworks required' },
  { value: '100%', label: 'Static uptime on GitHub Pages' },
];

export const landingPillars: Pillar[] = [
  {
    title: 'Operational clarity',
    description:
      'Roll critical metrics, risk notes, and deployment outcomes into calm, version-controlled sections leadership can trust.',
  },
  {
    title: 'Enterprise composure',
    description:
      'Pre-built cards, badges, and scoreboards deliver a boardroom-ready look without adding runtime dependencies.',
  },
  {
    title: 'Audit-ready history',
    description:
      'Collections enforce schema rules so launch notes and incident retros stay structured, discoverable, and compliant.',
  },
  {
    title: 'Executive storytelling',
    description:
      'Narrative frameworks surface customer impact, revenue signals, and risk posture in language your stakeholders expect.',
  },
  {
    title: 'Disciplined rollouts',
    description:
      'Preview pipelines combine lint, type-checks, and error review into a single command before every production push.',
  },
  {
    title: 'Static integrations',
    description:
      'Embed charts, badges, and data snapshots as generated assets, keeping security teams happy and performance high.',
  },
];

export const systemHighlightItems: HighlightItem[] = [
  {
    label: '01',
    title: 'Runtime zero',
    description:
      'Every widget renders at build time. No hydration scripts, no runtime costs, and nothing to babysit once deployed.',
  },
  {
    label: '02',
    title: 'Design tokens',
    description:
      'Tailwind defaults ship with a balanced industrial palette, typography scale, and consistent radii for hard-working UI.',
  },
  {
    label: '03',
    title: 'Governance ready',
    description:
      'Collections enforce schema rules so status updates, changelogs, and compliance notes stay structured and audit friendly.',
  },
  {
    label: '04',
    title: 'Trusted rollouts',
    description:
      'Preview pipelines and a pre-deploy script combine lint, type-check, and error review into one repeatable command.',
  },
  {
    label: '05',
    title: 'Reporting cadence',
    description:
      'Templates cover weekly health, major launches, and incident retros with carefully spaced typography for readability.',
  },
  {
    label: '06',
    title: 'Static integrations',
    description:
      'Embed charts, badges, and data snapshots as generated assets—no need for third-party scripts or live connections.',
  },
];

export const playbookSteps: PlaybookStep[] = [
  {
    step: '01',
    title: 'Capture the essentials',
    detail:
      'Start with project health, key metrics, and last deployment summary. The hero section keeps copy tight and scannable.',
  },
  {
    step: '02',
    title: 'Frame executive updates',
    detail:
      'Use highlights and testimonials to communicate wins, risk, and customer impact without shipping new dashboards.',
  },
  {
    step: '03',
    title: 'Publish with confidence',
    detail:
      'Run the bundled pre-deploy script. Once green, push to main and let GitHub Pages handle the static release.',
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      'The weekly rollups keep leadership focused on trends instead of chasing down screenshots.',
    name: 'Danielle Ortiz',
    role: 'VP Engineering, Northwind',
  },
  {
    quote:
      'We replaced three different dashboards with one Astro site and shipping finally feels predictable.',
    name: 'Marcus Chen',
    role: 'Head of Product, Globex',
  },
];

export const engagementTracks: EngagementTrack[] = [
  {
    name: 'Launch blueprint',
    timeline: 'Two-week audit',
    summary:
      'Tighten your narrative, metrics, and governance cadence before going live. Ideal for teams modernising status updates.',
    deliverables: [
      'Architecture and deployment review',
      'Narrative + tone workshop',
      'Executive-ready content roadmap',
    ],
  },
  {
    name: 'Operations retainer',
    timeline: 'Quarterly partnership',
    summary:
      'Embed our team to produce ongoing executive readouts, maintain templates, and ensure every release hits the standard.',
    deliverables: [
      'Monthly leadership briefs',
      'Metrics instrumentation guides',
      'Quarterly QBR deck support',
    ],
  },
  {
    name: 'Executive brief kit',
    timeline: '10-day turnaround',
    summary:
      'A polished library of layouts, messaging frameworks, and checklists so your team can publish with confidence on day one.',
    deliverables: [
      'Template and block library',
      'Copy and tone standards',
      'Rollout and review checklist',
    ],
  },
];

export const controlStack: ControlStackItem[] = [
  {
    name: 'Release discipline',
    metric: '±48h',
    metricLabel: 'Deployment forecast',
    summary:
      'Keep engineering, compliance, and stakeholders aligned on when the next release lands and what makes it production ready.',
    bullets: [
      'Automated status scoring before every push',
      'Risk narratives surfaced for leadership reviews',
      'Evidence bundles generated for compliance teams',
    ],
  },
  {
    name: 'Operations telemetry',
    metric: '92%',
    metricLabel: 'Report reuse rate',
    summary:
      'Turn recurring reports into governed templates that stay polished, accessible, and painless to update.',
    bullets: [
      'Composable sections for launches and retros',
      'Single source of truth for product and ops data',
      'Structured archives with search-friendly metadata',
    ],
  },
  {
    name: 'Stakeholder clarity',
    metric: '15 min',
    metricLabel: 'Executive prep time',
    summary:
      'Deliver succinct, on-brand briefings that cut through noise while capturing the detail auditors expect.',
    bullets: [
      'Narrative frameworks tuned for revenue and risk',
      'Live-to-static workflows for dashboards and charts',
      'Versioned approvals with automated changelogs',
    ],
  },
];

export const insightReports: InsightReport[] = [
  {
    category: 'Brief',
    title: 'Incident simulation kit',
    description:
      'A ready-to-run exercise playbook that keeps product, operations, and customer teams aligned before the next escalation.',
    linkLabel: 'Preview the kit',
    href: 'services/',
  },
  {
    category: 'Checklist',
    title: 'Launch governance audit',
    description:
      'A condensed review flow for security, compliance, and product sign-off designed for static delivery teams.',
    linkLabel: 'Run the audit',
    href: 'pricing/',
  },
  {
    category: 'Playbook',
    title: 'Executive reporting cadence',
    description:
      'Weekly, monthly, and quarterly templates that reduce prep while amplifying the story leadership needs to hear.',
    linkLabel: 'See the cadence',
    href: 'about/',
  },
];

export const securitySummary: SecuritySummary = {
  intro:
    'Security conversations stay straightforward when every asset is static, audited, and version controlled inside the repo.',
  principles: [
    {
      indicator: 'No runtime dependencies',
      title: 'Static by default',
      description:
        'Pages compile to pure HTML and CSS. Nothing runs on the client, so there are no API keys, secrets, or third-party scripts to manage.',
    },
    {
      indicator: 'Structured content model',
      title: 'Schema-backed content',
      description:
        'Collections and TypeScript types enforce the fields you expect, tightening editorial workflows and keeping compliance teams confident.',
    },
    {
      indicator: 'Operator-grade logging',
      title: 'Predictable deploys',
      description:
        'Pre-deploy scripts verify types, lint rules, and error states before release, producing an auditable trail for every push to production.',
    },
  ],
};
