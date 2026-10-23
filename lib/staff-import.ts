// Reads a staff list from an Excel workbook. Only name, email, department and position
// are read; every other column (ID numbers, addresses, bank details…) is ignored.
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./db/schema";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

export type StaffRow = { name: string; email: string; department: string; position: string };
export type StaffSheet = { sheet: string; rows: StaffRow[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function classify(header: string) {
  const h = header.toLowerCase();
  if (/e-?mail/.test(h)) return "email";
  if (/tiếng việt|베트남어/.test(h)) return "nameVi";
  if (/(họ (và )?tên|tên)/.test(h) && !/hàn|한글/.test(h)) return "name";
  if (/chức vụ|vị trí|position|직위/.test(h)) return "position";
  if (/phòng ban|department|본부명/.test(h)) return "department";
  return null;
}

/** "NGUYỄN HỮU BIỀN" → "Nguyễn Hữu Biền"; names already in mixed case are kept. */
export function tidyName(raw: string) {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name !== name.toLocaleUpperCase("vi")) return name;
  return name
    .toLocaleLowerCase("vi")
    .split(" ")
    .map((w) => w.charAt(0).toLocaleUpperCase("vi") + w.slice(1))
    .join(" ");
}

export async function parseStaffWorkbook(data: ArrayBuffer): Promise<StaffSheet[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const out: StaffSheet[] = [];

  wb.eachSheet((ws) => {
    const text = (r: number, c: number) => (ws.getRow(r).getCell(c).text ?? "").replace(/\s+/g, " ").trim();
    const lastCol = Math.min(ws.columnCount, 60);

    // The header ends at the last row (near the top) that has an "email" heading.
    let headerEnd = 0;
    for (let r = 1; r <= Math.min(ws.rowCount, 20); r++) {
      for (let c = 1; c <= lastCol; c++) if (/^e-?mail$/i.test(text(r, c))) headerEnd = r;
    }
    if (!headerEnd) return;

    // Header rows have several labelled cells; a sheet title row has just one.
    const headerRows = Array.from({ length: headerEnd }, (_, i) => i + 1).filter(
      (r) => Array.from({ length: lastCol }, (_, c) => text(r, c + 1)).filter(Boolean).length >= 3,
    );
    const cols: Record<string, number> = {};
    for (let c = 1; c <= lastCol; c++) {
      const header = headerRows.map((r) => text(r, c)).join(" ");
      const kind = classify(header);
      if (kind && !cols[kind]) cols[kind] = c;
    }
    const nameCol = cols.nameVi ?? cols.name;
    if (!cols.email || !nameCol) return;

    const rows: StaffRow[] = [];
    for (let r = headerEnd + 1; r <= ws.rowCount; r++) {
      const email = text(r, cols.email).toLowerCase();
      const name = text(r, nameCol);
      if (!EMAIL.test(email) || !name) continue;
      rows.push({
        name: tidyName(name),
        email,
        department: cols.department ? text(r, cols.department) : "",
        position: cols.position ? text(r, cols.position) : "",
      });
    }
    if (rows.length) out.push({ sheet: ws.name, rows });
  });
  return out;
}

/** Directors receive reports rather than write them, so they start untracked. */
export function defaultTracked(position: string) {
  return !/giám đốc/i.test(position);
}

/**
 * Adds new people (default password, employee role) and updates the name, department
 * and position of people who already have an account. Roles and passwords are never changed.
 */
export async function upsertStaff(
  db: NeonHttpDatabase<typeof schema>,
  rows: (StaffRow & { tracked: boolean })[],
  defaultPassword: string,
) {
  const hash = await bcrypt.hash(defaultPassword, 10);
  const existing = await db.select({ email: schema.users.email, sortOrder: schema.users.sortOrder }).from(schema.users);
  const known = new Set(existing.map((u) => u.email));
  let order = Math.max(0, ...existing.map((u) => u.sortOrder));
  let added = 0;
  let updated = 0;
  for (const r of rows) {
    const fields = { name: r.name, department: r.department || null, position: r.position || null };
    if (known.has(r.email)) {
      await db.update(schema.users).set(fields).where(eq(schema.users.email, r.email));
      updated++;
    } else {
      await db.insert(schema.users).values({ ...fields, email: r.email, passwordHash: hash, tracked: r.tracked, sortOrder: ++order });
      known.add(r.email);
      added++;
    }
  }
  return { added, updated };
}
