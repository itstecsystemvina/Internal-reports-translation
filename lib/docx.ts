import "server-only";
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, ShadingType,
  Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType,
} from "docx";
import type { ReportContent } from "@/lib/types";

type Lang = "vi" | "ko";
export type ExportItem = { name: string; content: ReportContent; untranslated?: boolean };

const T = {
  vi: { title: "BÁO CÁO CÔNG VIỆC TUẦN", currentWeek: "Tuần này", nextWeek: "Kế hoạch tuần sau", task: "Tên công việc", date: "Ngày", who: "Người thực hiện", done: "Hoàn thành", font: "Arial", missing: "" },
  ko: { title: "주간 업무 보고", currentWeek: "이번 주", nextWeek: "다음 주 계획", task: "업무명", date: "날짜", who: "담당자", done: "완료율", font: "Malgun Gothic", missing: " (번역 없음 · 베트남어 원문)" },
};

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "C9D3DA" };
const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const COLS = [5000, 1100, 1900, 1100]; // twips, total 9100

export async function buildDocx(items: ExportItem[], lang: Lang, weekLabel: string) {
  const L = T[lang];
  const run = (text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text, font: L.font, size: opts.size ?? 20, bold: opts.bold, color: opts.color });

  const cell = (text: string, width: number, header = false, center = false) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      shading: header ? { type: ShadingType.CLEAR, fill: "0F4C5C", color: "auto" } : undefined,
      children: [
        new Paragraph({
          alignment: header || center ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [run(text, header ? { bold: true, color: "FFFFFF", size: 18 } : { size: 19 })],
        }),
      ],
    });

  const body: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [run(`${L.title} — ${weekLabel}`, { bold: true, size: 30, color: "0F4C5C" })],
    }),
  ];

  for (const item of items) {
    body.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 120 },
        children: [run(item.name + (item.untranslated ? L.missing : ""), { bold: true, size: 26, color: "14212B" })],
      }),
    );
    for (const side of ["currentWeek", "nextWeek"] as const) {
      for (const section of item.content[side].filter((s) => s.tasks.length)) {
        body.push(
          new Paragraph({
            spacing: { before: 160, after: 80 },
            children: [run(`[${L[side]}] ${section.category}`, { bold: true, size: 21, color: "0F4C5C" })],
          }),
          new Table({
            width: { size: COLS.reduce((a, b) => a + b), type: WidthType.DXA },
            columnWidths: COLS,
            rows: [
              new TableRow({ tableHeader: true, children: [cell(L.task, COLS[0], true), cell(L.date, COLS[1], true), cell(L.who, COLS[2], true), cell(L.done, COLS[3], true)] }),
              ...section.tasks.map(
                (t) =>
                  new TableRow({
                    children: [cell(t.name, COLS[0]), cell(t.date, COLS[1], false, true), cell(t.assignee, COLS[2], false, true), cell(`${t.completion}%`, COLS[3], false, true)],
                  }),
              ),
            ],
          }),
        );
      }
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: L.font } } } },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children: body }],
  });
  return Packer.toBuffer(doc);
}
