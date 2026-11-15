/**
 * A small .xlsx reader for LinkedIn's analytics export (KADE docs/influence-measurement.md). An .xlsx file is a zip of
 * XML; this reads the zip's central directory, inflates each part with the platform's DecompressionStream, and returns
 * every sheet as rows of cell text. Enough for plain exported data: no formulas, styles or dates as numbers.
 */

export type Sheets = Record<string, string[][]>;

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data.slice() as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** The zip's files by name. Only stored (0) and deflated (8) entries, which is all Office writes. */
export async function unzip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const b = new Uint8Array(buf);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("this is not an Excel file. Upload LinkedIn's analytics export: your profile's .xlsx, or the company page's Content .xls");
  const count = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const out = new Map<string, Uint8Array>();
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (u32(b, p) !== 0x02014b50) throw new Error("The .xlsx file's zip directory is damaged");
    const method = u16(b, p + 10), size = u32(b, p + 20), nameLen = u16(b, p + 28), extraLen = u16(b, p + 30), commentLen = u16(b, p + 32), local = u32(b, p + 42);
    const name = dec.decode(b.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    const raw = b.subarray(start, start + size);
    if (method === 0) out.set(name, raw);
    else if (method === 8) out.set(name, await inflate(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const unescape = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, "&");
/** All text runs inside one XML fragment (a shared string or an inline string). */
const textOf = (xml: string) => unescape([...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));

/** Column letters to a 0-based index: A → 0, AA → 26. */
export function colIndex(ref: string): number {
  const letters = ref.replace(/\d+$/, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export async function readXlsx(buf: ArrayBuffer): Promise<Sheets> {
  const files = await unzip(buf);
  const dec = new TextDecoder();
  const text = (name: string) => { const f = files.get(name); return f ? dec.decode(f) : ""; };
  const shared = [...text("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
  const rels = new Map([...text("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1] ?? "", target = /Target="([^"]+)"/.exec(m[0])?.[1] ?? "";
    return [id, target.replace(/^\/?(xl\/)?/, "xl/")] as const;
  }));
  const sheets: Sheets = {};
  for (const m of text("xl/workbook.xml").matchAll(/<sheet\b[^>]*>/g)) {
    const name = unescape(/name="([^"]*)"/.exec(m[0])?.[1] ?? "");
    const rid = /r:id="([^"]+)"/.exec(m[0])?.[1] ?? "";
    const xml = text(rels.get(rid) ?? "");
    const rows: string[][] = [];
    for (const r of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const rowNum = Number(/r="(\d+)"/.exec(r[0])?.[1] ?? rows.length + 1);
      const row: string[] = [];
      for (const c of (r[1] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1], body = c[2] ?? "";
        const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
        const idx = ref ? colIndex(ref) : row.length;
        const type = /t="([^"]+)"/.exec(attrs)?.[1];
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        row[idx] = type === "s" ? shared[Number(v)] ?? "" : type === "inlineStr" ? textOf(body) : unescape(v ?? "");
      }
      rows[rowNum - 1] = Array.from(row, (x) => x ?? "");
    }
    sheets[name] = Array.from(rows, (x) => x ?? []);
  }
  return sheets;
}
