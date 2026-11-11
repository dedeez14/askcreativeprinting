import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Renders the legal pages' Markdown subset as React elements (no HTML injection):
 * "## " / "### " headings, blank-line paragraphs, "- " / "* " lists, **bold** and [text](url) links.
 * Site-relative links (/privacy-policy) use the router; mailto:, tel: and https: links are plain anchors.
 */

type Block =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul"; items: string[] };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    if (list) blocks.push({ type: "ul", items: list });
    para = [];
    list = null;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text: heading[2] });
      continue;
    }
    const item = /^[-*]\s+(.*)$/.exec(line);
    if (item) {
      if (para.length) {
        blocks.push({ type: "p", text: para.join(" ") });
        para = [];
      }
      (list ??= []).push(item[1]);
      continue;
    }
    if (list) {
      // A line right under a list item continues that item.
      list[list.length - 1] += " " + line;
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[1] !== undefined) {
      out.push(
        <strong key={key} className="font-medium text-forest-900">
          {m[1]}
        </strong>,
      );
    } else {
      const label = m[2];
      const href = m[3];
      const cls = "text-[#2A9D8F] underline underline-offset-2 hover:text-forest-900 break-words";
      if (!SAFE_HREF.test(href)) {
        out.push(label);
      } else if (href.startsWith("/")) {
        out.push(
          <Link key={key} to={href} className={cls}>
            {label}
          </Link>,
        );
      } else {
        const external = /^https?:/i.test(href);
        out.push(
          <a
            key={key}
            href={href}
            className={cls}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {label}
          </a>,
        );
      }
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function LegalMarkdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="font-body text-forest-900/75 text-[15px] md:text-base leading-relaxed">
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.type) {
          case "h2":
            return (
              <h2 key={k} className="font-display text-xl md:text-2xl text-forest-900 uppercase mt-10 mb-3 first:mt-0">
                {renderInline(b.text, k)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={k} className="font-body font-medium text-lg text-forest-900 mt-6 mb-2">
                {renderInline(b.text, k)}
              </h3>
            );
          case "ul":
            return (
              <ul key={k} className="list-disc pl-5 space-y-2 mb-4 marker:text-[#2A9D8F]">
                {b.items.map((item, j) => (
                  <li key={`${k}-${j}`}>{renderInline(item, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={k} className="mb-4">
                {renderInline(b.text, k)}
              </p>
            );
        }
      })}
    </div>
  );
}
