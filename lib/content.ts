import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Doc = {
  slug: string;
  title: string;
  description?: string;
  hindi?: string; // optional Hindi subtitle
  order?: number;
  date?: string;
  tag?: string;
  body: string;
  [key: string]: unknown;
};

function readDir(sub: string): Doc[] {
  const dir = path.join(CONTENT_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const slug = file.replace(/\.mdx?$/, "");
      return { slug, body: content, ...(data as Record<string, unknown>) } as Doc;
    })
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getDocs(sub: string): Doc[] {
  return readDir(sub);
}

export function getDoc(sub: string, slug: string): Doc | null {
  const file = path.join(CONTENT_DIR, sub, `${slug}.md`);
  const fileMdx = path.join(CONTENT_DIR, sub, `${slug}.mdx`);
  const target = fs.existsSync(file)
    ? file
    : fs.existsSync(fileMdx)
      ? fileMdx
      : null;
  if (!target) return null;
  const raw = fs.readFileSync(target, "utf8");
  const { data, content } = matter(raw);
  return { slug, body: content, ...(data as Record<string, unknown>) } as Doc;
}

export function getNews(): Doc[] {
  return readDir("news").sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );
}
