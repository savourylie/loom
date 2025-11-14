import { AppShell } from "@/components/app-shell";

const docSections = [
  {
    title: "Grammar primitives",
    summary: "Nodes, stack/grid placement, style sheets.",
    bullets: [
      "Each block compiles into a node with optional children.",
      "Use `place` meta to map to grid tracks or spans.",
      "Style rules support `type()`, `.class`, and `#id` selectors.",
    ],
  },
  {
    title: "Panel contracts",
    summary: "Split panes feed the editor/preview pair.",
    bullets: [
      "Editor emits AST + diagnostics.",
      "Preview consumes AST + theme token snapshot.",
      "Zustand store tracks focused pane + layout.",
    ],
  },
  {
    title: "MDX strategy",
    summary: "Docs authored in MDX and rendered as RSC.",
    bullets: [
      "MDX under `/docs/reference` with route groups.",
      "Code blocks use the same syntax highlighter as editor.",
      "Front-matter drives table of contents + anchors.",
    ],
  },
];

const releaseNotes = [
  { label: "T-010", detail: "Wire parser + AST store (ETA next sprint)." },
  { label: "T-011", detail: "SVG renderer + export CTA." },
  { label: "T-015", detail: "Docs fleshed out with real MDX content." },
];

export default function DocsPage() {
  return (
    <AppShell
      title="Docs live inside the same shell"
      description="Docs run as server components so we can pre-render reference material and reuse the same chrome. The layout stays identical so navigation feels consistent."
      primaryPanel={{
        title: "Docs layout",
        description:
          "Reference entries, MDX-driven navigation, and copy-to-clipboard widgets.",
        body: <DocsOverview />,
        footer:
          "MDX hydration and content import resolved in follow-up docs ticket.",
      }}
      secondaryPanel={{
        title: "Release outline",
        description: "Tickets that extend this surface next.",
        body: <ReleaseTimeline />,
      }}
    />
  );
}

function DocsOverview() {
  return (
    <div className="space-y-4">
      {docSections.map((section) => (
        <article
          key={section.title}
          className="rounded-2xl border bg-background/80 p-4 shadow-sm"
        >
          <header className="mb-2">
            <h3 className="text-base font-semibold text-foreground">
              {section.title}
            </h3>
            <p className="text-sm text-muted-foreground">{section.summary}</p>
          </header>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {section.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function ReleaseTimeline() {
  return (
    <div className="space-y-4">
      {releaseNotes.map((note) => (
        <div
          key={note.label}
          className="rounded-2xl border bg-secondary/30 p-4 text-sm text-foreground"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {note.label}
          </p>
          <p>{note.detail}</p>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Console diagnostics confirm which route is mounted so we can keep this
        responsive behavior honest while the real docs arrive.
      </p>
    </div>
  );
}
