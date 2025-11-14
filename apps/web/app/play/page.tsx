import { AppShell } from "@/components/app-shell";
import { EditorPanel } from "@/components/editor-panel";

export default function PlayPage() {
  return (
    <AppShell
      title="Play in the Loom DSL playground"
      description="Draft layouts, preview them instantly, and export SVG once the compiler is wired up. This shell keeps the layout flexible while we build the editor and renderer."
      primaryPanel={{
        title: "Editor Panel",
        description: "Write Loom DSL with live parsing, gutter markers, and template presets.",
        body: <EditorPanel />,
        footer:
          "Parser + diagnostics run every ~140ms; Cmd+Enter re-renders & Cmd+S fires export stub.",
      }}
      secondaryPanel={{
        title: "Preview Panel",
        description:
          "Framer motion helps us keep transitions calm while rendering SVG.",
        body: <PreviewPlaceholder />,
        footer: "Renderer + export pipeline lands in T-011/T-012.",
      }}
    />
  );
}

function PreviewPlaceholder() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Preview</span>
        <span className="text-emerald-500">ready</span>
      </div>
      <div className="relative flex flex-1 items-center justify-center rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/20 p-6">
        <div className="aspect-[4/3] w-full max-w-lg rounded-3xl border-2 border-dashed border-foreground/20 bg-background/80 p-6 shadow-2xl">
          <div className="grid h-full grid-cols-2 gap-3">
            <div className="rounded-2xl border border-foreground/30 bg-primary/10"></div>
            <div className="rounded-2xl border border-foreground/10 bg-secondary/60"></div>
            <div className="col-span-2 rounded-2xl border border-foreground/10 bg-accent/50"></div>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Export actions are stubbed—hooking into the compiler is handled by
        follow-up tickets.
      </p>
    </div>
  );
}
