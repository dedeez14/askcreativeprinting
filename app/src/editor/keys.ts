import { useEffect, useLayoutEffect, useRef } from "react";
import { duplicateLayer, newId, removeLayer, type Update } from "./state";
import { place } from "./wrap";
import type { DesignDoc, Layer } from "./types";

interface KeyTarget {
  doc: DesignDoc;
  update: Update;
  undo: () => void;
  redo: () => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  product: string;
}

/** Arrow keys nudge, Delete removes, Ctrl/Cmd+Z / Shift+Z / Y undo and redo, Ctrl+D duplicates. */
export function useEditorKeys(enabled: boolean, p: KeyTarget) {
  const ref = useRef(p);
  useLayoutEffect(() => { ref.current = p; });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const { doc, update, undo, redo, selectedId, onSelect, product } = ref.current;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      const sel = doc.layers.find((l) => l.id === selectedId);
      if (!sel) return;
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); const id = newId(); update(duplicateLayer(sel.id, id)); onSelect(id); return; }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); update(removeLayer(sel.id)); onSelect(null); return; }
      if (e.key === "Escape") { onSelect(null); return; }
      const step = e.shiftKey ? 10 : 1;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (d) {
        e.preventDefault();
        // Nudging past a side seam of a full print carries the element round to the other view.
        update((doc0) => ({ ...doc0, layers: doc0.layers.map((l) => (l.id === sel.id ? place({ ...l, x: l.x + d[0], y: l.y + d[1] } as Layer, product, doc0.mode) : l)) }), `k:${sel.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

