/**
 * A small reader for the old binary Excel format (.xls, BIFF8), which is what LinkedIn's company page exports are
 * (KADE docs/influence-measurement.md). It reads the compound file, finds the Workbook stream, and returns every sheet
 * as rows of cell text: shared strings, inline labels, numbers and cached formula results. No styles, no formulas.
 */
import type { Sheets } from "./xlsx";

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const i32 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24);
const END = 0xfffffffe, FREE = 0xffffffff;

export const isXls = (buf: ArrayBuffer) => {
  const b = new Uint8Array(buf, 0, Math.min(8, buf.byteLength));
  return [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((x, i) => b[i] === x);
};

/** The named stream from a compound file (OLE2). */
function cfbStream(b: Uint8Array, want: string[]): Uint8Array {
  const secSize = 1 << u16(b, 0x1e), miniSize = 1 << u16(b, 0x20);
  const sector = (n: number) => 512 + n * secSize;
  // The FAT: its sectors are listed in the header's DIFAT, then in DIFAT sectors.
  const fatSectors: number[] = [];
  for (let i = 0; i < 109; i++) { const s = u32(b, 0x4c + i * 4); if (s !== FREE && s !== END) fatSectors.push(s); }
  let difat = u32(b, 0x44);
  for (let guard = 0; difat !== END && difat !== FREE && guard < 1000; guard++) {
    const at = sector(difat), per = secSize / 4 - 1;
    for (let i = 0; i < per; i++) { const s = u32(b, at + i * 4); if (s !== FREE && s !== END) fatSectors.push(s); }
    difat = u32(b, at + per * 4);
  }
  const fat: number[] = [];
  for (const s of fatSectors) for (let i = 0; i < secSize / 4; i++) fat.push(u32(b, sector(s) + i * 4));
  const chain = (start: number, next: number[], max: number) => {
    const out: number[] = [];
    for (let s = start; s !== END && s !== FREE && out.length < max; s = next[s] ?? END) out.push(s);
    return out;
  };
  const read = (start: number, size: number) => {
    const out = new Uint8Array(size);
    let o = 0;
    for (const s of chain(start, fat, 1 << 20)) { const at = sector(s); const n = Math.min(secSize, size - o); out.set(b.subarray(at, at + n), o); o += n; if (o >= size) break; }
    return out;
  };
  const dirs = read(u32(b, 0x30), chain(u32(b, 0x30), fat, 1 << 16).length * secSize);
  const entries: { name: string; type: number; start: number; size: number }[] = [];
  for (let o = 0; o + 128 <= dirs.length; o += 128) {
    const len = u16(dirs, o + 64);
    let name = "";
    for (let i = 0; i < Math.max(0, len / 2 - 1); i++) name += String.fromCharCode(u16(dirs, o + i * 2));
    entries.push({ name, type: dirs[o + 66], start: u32(dirs, o + 116), size: u32(dirs, o + 120) });
  }
  const e = entries.find((x) => x.type === 2 && want.includes(x.name));
  if (!e) throw new Error("No Workbook stream in this .xls file");
  if (e.size >= u32(b, 0x38)) return read(e.start, e.size);
  // A small stream lives in the mini stream (the root entry's data), chained by the mini FAT.
  const root = entries[0];
  const mini = read(root.start, root.size);
  const minifat: number[] = [];
  for (const s of chain(u32(b, 0x3c), fat, 1 << 16)) for (let i = 0; i < secSize / 4; i++) minifat.push(u32(b, sector(s) + i * 4));
  const out = new Uint8Array(e.size);
  let o = 0;
  for (const s of chain(e.start, minifat, 1 << 20)) { const n = Math.min(miniSize, e.size - o); out.set(mini.subarray(s * miniSize, s * miniSize + n), o); o += n; if (o >= e.size) break; }
  return out;
}

/** An RK value: a packed number. */
function rk(v: number): number {
  const x100 = v & 1, isInt = v & 2;
  let n: number;
  if (isInt) n = v >> 2;
  else { const buf = new DataView(new ArrayBuffer(8)); buf.setUint32(4, v & 0xfffffffc, true); buf.setUint32(0, 0, true); n = buf.getFloat64(0, true); }
  return x100 ? n / 100 : n;
}

const num = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1e9) / 1e9));

/** Reads a BIFF8 unicode string from record data that may run on into CONTINUE records. */
class Cursor {
  i = 0; part = 0;
  constructor(private parts: Uint8Array[]) {}
  private get cur() { return this.parts[this.part]; }
  private next() { this.part++; this.i = 0; }
  u8() { if (this.i >= this.cur.length) this.next(); return this.cur[this.i++]; }
  u16() { return this.u8() | (this.u8() << 8); }
  u32() { return (this.u16() | (this.u16() << 16)) >>> 0; }
  skip(n: number) { for (let k = 0; k < n; k++) this.u8(); }
  str(): string {
    const len = this.u16();
    let flags = this.u8();
    const runs = flags & 0x08 ? this.u16() : 0;
    const ext = flags & 0x04 ? this.u32() : 0;
    let s = "";
    for (let k = 0; k < len; k++) {
      // A string split across records starts the new record with a fresh "wide or not" flag byte.
      if (this.i >= this.cur.length) { this.next(); flags = this.cur[this.i++]; }
      s += String.fromCharCode(flags & 1 ? this.u16() : this.u8());
    }
    this.skip(runs * 4 + ext);
    return s;
  }
}

export function readXls(buf: ArrayBuffer): Sheets {
  const wb = cfbStream(new Uint8Array(buf), ["Workbook", "Book"]);
  const recs: { type: number; data: Uint8Array; at: number }[] = [];
  for (let o = 0; o + 4 <= wb.length;) {
    const type = u16(wb, o), len = u16(wb, o + 2);
    recs.push({ type, data: wb.subarray(o + 4, o + 4 + len), at: o });
    o += 4 + len;
  }
  const sst: string[] = [];
  const sheetsAt: { name: string; offset: number }[] = [];
  for (let k = 0; k < recs.length; k++) {
    const r = recs[k];
    if (r.type === 0x0085) {
      const nameLen = r.data[6], wide = r.data[7] & 1;
      let name = "";
      for (let i = 0; i < nameLen; i++) name += String.fromCharCode(wide ? u16(r.data, 8 + i * 2) : r.data[8 + i]);
      sheetsAt.push({ name, offset: u32(r.data, 0) });
    } else if (r.type === 0x00fc) {
      const parts = [r.data.subarray(8)];
      for (let j = k + 1; j < recs.length && recs[j].type === 0x003c; j++) parts.push(recs[j].data);
      const c = new Cursor(parts);
      const unique = u32(r.data, 4);
      for (let n = 0; n < unique; n++) { try { sst.push(c.str()); } catch { break; } }
    }
  }
  const out: Sheets = {};
  for (const sh of sheetsAt) {
    const rows: string[][] = [];
    const set = (row: number, col: number, v: string) => { (rows[row] ??= [])[col] = v; };
    let k = recs.findIndex((r) => r.at === sh.offset);
    if (k < 0) continue;
    for (k++; k < recs.length && recs[k].type !== 0x000a; k++) {
      const { type, data: d } = recs[k];
      if (type === 0x00fd) set(u16(d, 0), u16(d, 2), sst[u32(d, 6)] ?? "");
      else if (type === 0x0203) set(u16(d, 0), u16(d, 2), num(new DataView(d.buffer, d.byteOffset + 6, 8).getFloat64(0, true)));
      else if (type === 0x027e) set(u16(d, 0), u16(d, 2), num(rk(i32(d, 6))));
      else if (type === 0x00bd) { const row = u16(d, 0), first = u16(d, 2); for (let c = 0; 4 + c * 6 + 6 <= d.length - 2; c++) set(row, first + c, num(rk(i32(d, 4 + c * 6 + 2)))); }
      else if (type === 0x0204) set(u16(d, 0), u16(d, 2), new Cursor([d.subarray(6)]).str());
      else if (type === 0x0006) {
        const row = u16(d, 0), col = u16(d, 2);
        if (u16(d, 12) !== 0xffff) set(row, col, num(new DataView(d.buffer, d.byteOffset + 6, 8).getFloat64(0, true)));
        else if (d[6] === 0 && recs[k + 1]?.type === 0x0207) set(row, col, new Cursor([recs[k + 1].data]).str());
      }
    }
    out[sh.name] = Array.from(rows, (r) => Array.from(r ?? [], (x) => x ?? ""));
  }
  return out;
}
