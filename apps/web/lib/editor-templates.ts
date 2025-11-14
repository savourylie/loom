export type EditorTemplate = {
  id: string;
  label: string;
  summary: string;
  value: string;
};

export const editorTemplates: EditorTemplate[] = [
  {
    id: "grid-hero",
    label: "Grid hero",
    summary: "Two-column hero with supporting controls.",
    value: `grid 12 gap 16 pad 24

card hero {
  place c1/7 r1
  label "loom.hero"
  props accent="brand"
}

stack controls {
  place c7/13 r1
  props tone="muted"
}
`,
  },
  {
    id: "stats-board",
    label: "Stats board",
    summary: "Dashboard cards w/ sparklines.",
    value: `grid 8 gap 12 pad 20

card metric-a {
  place c1/5 r1
  label "impressions"
  props tone="frost"
}

card metric-b {
  place c5/9 r1
  label "ctr"
  props tone="amber"
}

stack trend {
  place c1/9 r2
  props tone="muted"
}
`,
  },
  {
    id: "docs-layout",
    label: "Docs layout",
    summary: "Sidebar nav + right rail callout.",
    value: `grid 12 gap 12 pad 16

stack nav {
  place c1/3 r1/5
  props tone="soft"
}

stack content {
  place c3/10 r1/5
  props tone="surface"
}

card rail {
  place c10/13 r1/5
  props tone="highlight"
}
`,
  },
];

export const defaultTemplateId = editorTemplates[0]?.id ?? "grid-hero";

export function getTemplateValue(id: string): string {
  const template = editorTemplates.find((entry) => entry.id === id);
  return template?.value ?? editorTemplates[0]?.value ?? "";
}
