import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

const templates = [
  {
    name: "Hero + CTA",
    summary: "2-column hero plus floating CTA button.",
    tags: ["grid", "hero"],
  },
  {
    name: "Stats board",
    summary: "Split cards with inline sparklines.",
    tags: ["stack", "data"],
  },
  {
    name: "Docs layout",
    summary: "Sidebar nav + right rail callouts.",
    tags: ["mdx", "docs"],
  },
];

const checklist = [
  "Templates hydrate from `/examples/[slug]` route.",
  "Slot preview loads DSL + theme snapshot.",
  "Export button pipes through renderer service.",
];

export default function ExamplesPage() {
  return (
    <AppShell
      title="Example templates"
      description="Template cards load Loom DSL presets. Selecting one hydrates `/play` with the same DSL so creators can tweak before exporting."
      primaryPanel={{
        title: "Template gallery",
        description: "Stubbed CTA uses Zustand store later.",
        body: <TemplateGallery />,
        footer: "Template metadata comes from `/examples` contentlayer.",
      }}
      secondaryPanel={{
        title: "Rollout checklist",
        description: "Keeps us honest as we wire the gallery.",
        body: <RolloutChecklist />,
      }}
    />
  );
}

function TemplateGallery() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {templates.map((template) => (
        <article
          key={template.name}
          className="flex flex-col rounded-2xl border bg-background/80 p-4 shadow-sm"
        >
          <div className="mb-3">
            <h3 className="text-base font-semibold text-foreground">
              {template.name}
            </h3>
            <p className="text-sm text-muted-foreground">{template.summary}</p>
          </div>
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-2 py-0.5 uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
          <Button disabled variant="secondary" size="sm" className="mt-auto">
            Load template
          </Button>
        </article>
      ))}
    </div>
  );
}

function RolloutChecklist() {
  return (
    <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
      {checklist.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
