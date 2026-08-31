import React from "react";

/**
 * A small, dependency-free markdown renderer covering the constructs used in
 * /content: headings, paragraphs, unordered/ordered lists, blockquotes,
 * horizontal rules, bold, inline code, and links. Good enough for MVP content;
 * swap for full MDX later if needed.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Tokenize links [text](url), **bold**, `code`
  const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1]) {
      const label = match[2];
      const url = match[3];
      const external = /^https?:\/\//.test(url);
      nodes.push(
        <a
          key={`${keyPrefix}-a-${i}`}
          href={url}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {label}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(<code key={`${keyPrefix}-c-${i}`}>{match[7]}</code>);
    }
    last = regex.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} />);
      i++;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const content = renderInline(h[2], `h${key}`);
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      blocks.push(React.createElement(Tag, { key: key++ }, content));
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={key++}>
          {renderInline(buf.join(" "), `bq${key}`)}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (gather until blank line)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !lines[i].startsWith(">") &&
      !/^---+$/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i++;
    }
    const text = para.join(" ");
    const isLead = text.startsWith("::lead ");
    blocks.push(
      <p key={key++} className={isLead ? "lead" : undefined}>
        {renderInline(isLead ? text.replace("::lead ", "") : text, `p${key}`)}
      </p>,
    );
  }

  return <div className="prose">{blocks}</div>;
}
