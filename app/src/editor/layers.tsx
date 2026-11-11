import { useEffect } from "react";
import { ensureFont, fontFamily } from "./fonts";
import { arcGeometry, layerBox, lines, LINE } from "./geometry";
import type { Layer, ShapeLayer, TextLayer } from "./types";

/**
 * Drawing one design layer. Every layer is drawn about its own centre, so moving is a translate and
 * rotating a rotate — the same transform the handles, the PNG export and the ERP JSON use.
 */

function shapePath(s: ShapeLayer): string {
  const w = s.w / 2, h = s.h / 2;
  switch (s.shape) {
    case "circle":
      return `M${-w},0 A${w},${h} 0 1 0 ${w},0 A${w},${h} 0 1 0 ${-w},0 Z`;
    case "star": {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const k = i % 2 ? 0.45 : 1;
        pts.push(`${(Math.cos(a) * w * k).toFixed(2)},${(Math.sin(a) * h * k + h * 0.1).toFixed(2)}`);
      }
      return `M${pts.join(" L")} Z`;
    }
    case "shield":
      return `M${-w},${-h} H${w} V${-h * 0.1} C${w},${h * 0.45} ${w * 0.4},${h * 0.8} 0,${h} C${-w * 0.4},${h * 0.8} ${-w},${h * 0.45} ${-w},${-h * 0.1} Z`;
    case "triangle":
      return `M0,${-h} L${w},${h} L${-w},${h} Z`;
    case "diamond":
      return `M0,${-h} L${w},0 L0,${h} L${-w},0 Z`;
    default: {
      const r = s.shape === "stripe" ? 0 : Math.min(w, h) * 0.24;
      return `M${-w + r},${-h} H${w - r} Q${w},${-h} ${w},${-h + r} V${h - r} Q${w},${h} ${w - r},${h} H${-w + r} Q${-w},${h} ${-w},${h - r} V${-h + r} Q${-w},${-h} ${-w + r},${-h} Z`;
    }
  }
}

function TextView({ t, idPrefix }: { t: TextLayer; idPrefix: string }) {
  useEffect(() => { void ensureFont(t.font, t.bold, t.italic); }, [t.font, t.bold, t.italic]);
  const common = {
    fontFamily: `${fontFamily(t.font)}, sans-serif`,
    fontSize: t.size,
    fontWeight: t.bold ? 700 : 400,
    fontStyle: t.italic ? "italic" : "normal",
    letterSpacing: (t.spacing / 100) * t.size,
    fill: t.color,
    ...(t.strokeWidth > 0
      ? { stroke: t.strokeColor, strokeWidth: (t.size * t.strokeWidth) / 50, strokeLinejoin: "round" as const, paintOrder: "stroke" }
      : {}),
  };
  const arc = arcGeometry(t);
  if (arc) {
    const id = `${idPrefix}-arc-${t.id}`;
    const sx = arc.r * Math.sin(arc.half);
    const ey = arc.up ? arc.y0 + arc.sag : arc.y0 - arc.sag;
    const d = `M${-sx},${ey} A${arc.r},${arc.r} 0 0 ${arc.up ? 1 : 0} ${sx},${ey}`;
    return (
      <>
        <defs><path id={id} d={d} /></defs>
        <text {...common} textAnchor="middle">
          <textPath href={`#${id}`} startOffset="50%">{lines(t)[0]}</textPath>
        </text>
      </>
    );
  }
  const ls = lines(t);
  const box = layerBox(t);
  const lh = t.size * LINE;
  const top = -(ls.length * lh) / 2;
  const x = t.align === "left" ? -box.w / 2 + (t.size * t.strokeWidth) / 100 : t.align === "right" ? box.w / 2 - (t.size * t.strokeWidth) / 100 : 0;
  const anchor = t.align === "left" ? "start" : t.align === "right" ? "end" : "middle";
  return (
    <text {...common} textAnchor={anchor}>
      {ls.map((l, i) => (
        <tspan key={i} x={x} y={top + i * lh + t.size * 0.86}>{l || " "}</tspan>
      ))}
    </text>
  );
}

/** One layer, positioned on the board. */
export function LayerView({ layer, idPrefix }: { layer: Layer; idPrefix: string }) {
  return (
    <g transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation})`} opacity={layer.opacity ?? 1}>
      {layer.type === "image" && (
        <image href={layer.src} x={-layer.w / 2} y={-layer.h / 2} width={layer.w} height={layer.h} preserveAspectRatio="none" />
      )}
      {layer.type === "text" && <TextView t={layer} idPrefix={idPrefix} />}
      {layer.type === "shape" && (
        <path d={shapePath(layer)} fill={layer.color}
          stroke={layer.strokeWidth > 0 ? layer.strokeColor : "none"} strokeWidth={layer.strokeWidth} strokeLinejoin="round" />
      )}
    </g>
  );
}

