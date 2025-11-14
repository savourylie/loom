"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseDocument, type Diagnostic } from "@/lib/loom-dsl";
import { Button } from "@/components/ui/button";
import { editorTemplates, getTemplateValue } from "@/lib/editor-templates";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/providers/store-provider";
import type { RenderReason } from "@/store/app-store";

const PARSE_DEBOUNCE_MS = 140;
const STATUS_RESET_MS = 3200;

const severityStyles: Record<
  "error" | "warning" | "info",
  { dot: string; pill: string; label: string }
> = {
  error: {
    dot: "bg-destructive",
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    label: "error",
  },
  warning: {
    dot: "bg-amber-400",
    pill: "border-amber-400/40 bg-amber-400/10 text-amber-600",
    label: "warning",
  },
  info: {
    dot: "bg-sky-400",
    pill: "border-sky-400/40 bg-sky-400/10 text-sky-600",
    label: "info",
  },
};

const fallbackDiagnostic = {
  code: "E999",
  severity: "error",
  message: "Parser crashed",
  line: 1,
  column: 1,
} as const;

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function EditorPanel() {
  const documentValue = useAppStore((state) => state.documentValue);
  const setDocumentValue = useAppStore((state) => state.setDocumentValue);
  const diagnostics = useAppStore((state) => state.diagnostics);
  const setDiagnostics = useAppStore((state) => state.setDiagnostics);
  const parseMetrics = useAppStore((state) => state.parseMetrics);
  const setParseMetrics = useAppStore((state) => state.setParseMetrics);
  const setLastValidDocument = useAppStore((state) => state.setLastValidDocument);
  const triggerRender = useAppStore((state) => state.triggerRender);
  const templateId = useAppStore((state) => state.templateId);
  const setTemplateId = useAppStore((state) => state.setTemplateId);
  const renderSignal = useAppStore((state) => state.renderSignal);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keystrokeWindowRef = useRef({ count: 0, startedAt: now() });
  const bootstrappedRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const lines = useMemo(() => documentValue.split("\n"), [documentValue]);
  const diagnosticsByLine = useMemo(() => {
    const map = new Map<number, Diagnostic[]>();
    diagnostics.forEach((diagnostic) => {
      const line = diagnostic.line ?? 1;
      map.set(line, [...(map.get(line) ?? []), diagnostic]);
    });
    return map;
  }, [diagnostics]);

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => {
      setStatusMessage(null);
    }, STATUS_RESET_MS);
  }, []);

  const registerKeystroke = useCallback(() => {
    const entry = keystrokeWindowRef.current;
    const current = now();
    if (current - entry.startedAt > 60_000) {
      entry.startedAt = current;
      entry.count = 0;
    }
    entry.count += 1;
  }, []);

  const getKpm = useCallback(() => {
    const entry = keystrokeWindowRef.current;
    const elapsedMinutes = (now() - entry.startedAt) / 60_000;
    if (elapsedMinutes <= 0) {
      return entry.count;
    }
    return entry.count / elapsedMinutes;
  }, []);

  const logMetrics = useCallback(
    (durationMs: number, diagnosticCount: number) => {
      const kpm = getKpm();
      const formattedDuration = durationMs.toFixed(1);
      const formattedKpm = Number.isFinite(kpm) ? kpm.toFixed(1) : "0.0";
      console.info(
        `[editor-panel] parse=${formattedDuration}ms diagnostics=${diagnosticCount} kpm=${formattedKpm}`,
      );
    },
    [getKpm],
  );

  const clearTimer = useCallback(() => {
    if (parseTimerRef.current) {
      clearTimeout(parseTimerRef.current);
      parseTimerRef.current = null;
    }
  }, []);

  const runParse = useCallback(
    (source: string, reason: RenderReason = "auto") => {
      setIsDebouncing(false);
      try {
        const start = now();
        const result = parseDocument(source);
        const duration = result.metrics?.parseTimeMs ?? now() - start;
        const hasErrors = result.diagnostics.some(
          (diagnostic) => diagnostic.severity === "error",
        );
        setDiagnostics(result.diagnostics);
        setParseMetrics(result.metrics);

        if (!hasErrors) {
          setLastValidDocument(result.document);
          triggerRender(reason);
        }

        logMetrics(duration, result.diagnostics.length);
      } catch (error) {
        console.error("[editor-panel] parser failure", error);
        setDiagnostics([fallbackDiagnostic]);
      }
    },
    [logMetrics, setDiagnostics, setLastValidDocument, setParseMetrics, triggerRender],
  );

  const scheduleParse = useCallback(
    (source: string) => {
      setIsDebouncing(true);
      clearTimer();
      parseTimerRef.current = setTimeout(
        () => runParse(source, "auto"),
        PARSE_DEBOUNCE_MS,
      );
    },
    [clearTimer, runParse],
  );

  const focusLine = useCallback(
    (lineNumber: number) => {
      if (!textareaRef.current) return;
      const safeLine = Math.min(Math.max(lineNumber, 1), lines.length);
      const linesBefore = lines.slice(0, safeLine - 1);
      const offset = linesBefore.reduce((acc, line) => acc + line.length + 1, 0);
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(offset, offset);
    },
    [lines],
  );

  const handleTemplateChange = useCallback(
    (template: string) => {
      const nextValue = getTemplateValue(template);
      setTemplateId(template);
      setDocumentValue(nextValue);
      clearTimer();
      runParse(nextValue, "auto");
      showStatus("Template applied");
    },
    [clearTimer, runParse, setDocumentValue, setTemplateId, showStatus],
  );

  const forceRun = useCallback(() => {
    clearTimer();
    runParse(documentValue, "manual");
  }, [clearTimer, documentValue, runParse]);

  const handleExport = useCallback(() => {
    console.info(
      `[editor-panel] export placeholder fired (render v${renderSignal.version})`,
    );
    showStatus("Export placeholder triggered (T-012 wires download).");
  }, [renderSignal.version, showStatus]);

  const handleFormat = useCallback(() => {
    showStatus("Format stub pending formatter ticket.");
  }, [showStatus]);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;
    runParse(documentValue, "auto");
  }, [documentValue, runParse]);

  useEffect(
    () => () => {
      clearTimer();
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    },
    [clearTimer],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleExport();
        return;
      }
      if (isMeta && event.key === "Enter") {
        event.preventDefault();
        forceRun();
        return;
      }
      if (!event.altKey && !event.metaKey && event.key.length === 1) {
        registerKeystroke();
      }
    },
    [forceRun, handleExport, registerKeystroke],
  );

  const handleScroll = useCallback(() => {
    if (!gutterRef.current || !textareaRef.current) return;
    gutterRef.current.scrollTop = textareaRef.current.scrollTop;
  }, []);

  const diagSummary =
    diagnostics.length === 0
      ? "No diagnostics"
      : `${diagnostics.length} diagnostic${
          diagnostics.length === 1 ? "" : "s"
        }`;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <label htmlFor="template-select" className="font-medium">
            Template
          </label>
          <select
            id="template-select"
            className="rounded-lg border bg-background px-2 py-1 text-xs text-foreground shadow-sm"
            value={templateId}
            onChange={(event) => handleTemplateChange(event.target.value)}
          >
            {editorTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            ⌘ + Enter render
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            ⌘ + S export
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5",
            isDebouncing && "border-amber-400/60 text-amber-600",
          )}
        >
          {isDebouncing ? "Parsing…" : "Idle"}
        </span>
        {parseMetrics ? (
          <span className="rounded-full border px-2 py-0.5">
            Parse {parseMetrics.parseTimeMs.toFixed(1)}ms · nodes{" "}
            {parseMetrics.nodeCount}
          </span>
        ) : null}
        <span className="rounded-full border px-2 py-0.5">
          {diagSummary}
        </span>
        <span className="text-[11px] text-muted-foreground/80">
          Render signal · v{renderSignal.version} ({renderSignal.reason})
        </span>
      </div>

      <div className="relative flex min-h-[320px] flex-1 overflow-hidden rounded-2xl border bg-background/80 shadow-inner">
        <div
          ref={gutterRef}
          className="editor-gutter flex w-14 select-none flex-col overflow-hidden border-r bg-muted/20 text-right text-xs leading-[1.6] text-muted-foreground"
        >
          {lines.map((_, index) => {
            const lineNumber = index + 1;
            const markers = diagnosticsByLine.get(lineNumber);
            return (
              <div
                key={lineNumber}
                className="flex min-h-[1.5rem] items-center justify-end gap-1 pr-2"
              >
                <span>{lineNumber}</span>
                {markers
                  ? markers.map((marker, markerIndex) => (
                      <button
                        key={marker.id ?? `${marker.code}-${lineNumber}-${markerIndex}`}
                        type="button"
                        onClick={() => focusLine(lineNumber)}
                        className={cn(
                          "group relative flex h-3 w-3 items-center justify-center rounded-full border border-transparent",
                          severityStyles[marker.severity].dot,
                        )}
                        aria-label={`${marker.code} at line ${lineNumber}: ${marker.message}`}
                      >
                        <span className="sr-only">
                          {marker.code} line {lineNumber}
                        </span>
                        <div className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-md transition group-focus-visible:block group-hover:block">
                          <span className="font-semibold">
                            {marker.code} · {severityStyles[marker.severity].label}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            line {lineNumber}, column {marker.column}
                          </span>
                          <div className="mt-1 text-muted-foreground">
                            {marker.message}
                          </div>
                          {marker.hint ? (
                            <div className="mt-1 text-muted-foreground/80">
                              Hint: {marker.hint}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    ))
                  : null}
              </div>
            );
          })}
        </div>
        <textarea
          ref={textareaRef}
          value={documentValue}
          onChange={(event) => {
            setDocumentValue(event.target.value);
            scheduleParse(event.target.value);
          }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-[1.6] text-foreground outline-none"
          aria-label="Loom DSL editor"
          data-loom-editor="true"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleFormat}>
          Format
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export (stub)
        </Button>
        <Button size="sm" onClick={forceRun}>
          Render preview
        </Button>
      </div>

      {statusMessage ? (
        <p
          role="status"
          className="text-xs font-medium text-muted-foreground"
        >
          {statusMessage}
        </p>
      ) : null}

      <DiagnosticsList diagnostics={diagnostics} />
    </div>
  );
}

type DiagnosticsListProps = {
  diagnostics: Diagnostic[];
};

function DiagnosticsList({ diagnostics }: DiagnosticsListProps) {
  if (diagnostics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-foreground/20 bg-muted/10 p-4 text-sm text-muted-foreground">
        Parser diagnostics will appear here. All clear for now.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background/80 p-4 text-sm text-foreground shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Diagnostics</span>
        <span>{diagnostics.length} issue{diagnostics.length === 1 ? "" : "s"}</span>
      </div>
      <ul className="space-y-3">
        {diagnostics.map((diagnostic, index) => (
          <li
            key={diagnostic.id ?? `${diagnostic.code}-${diagnostic.line}-${diagnostic.column}-${index}`}
            className="rounded-xl border px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide",
                  severityStyles[diagnostic.severity].pill,
                )}
              >
                {diagnostic.code}
              </span>
              <span>
                line {diagnostic.line}, col {diagnostic.column}
              </span>
            </div>
            <p className="mt-2 text-foreground">{diagnostic.message}</p>
            {diagnostic.hint ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Hint: {diagnostic.hint}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
