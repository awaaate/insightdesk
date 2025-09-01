#!/usr/bin/env bun

import chalk from "chalk";
import ora from "ora";
import * as XLSX from "xlsx";
import { DB } from "@/db";

type Row = (string | number | boolean | null | undefined)[];

function detectColumnIndex(headers: Row, candidates: string[]): number | null {
  const normalized = headers.map((h) =>
    typeof h === "string" ? h.trim().toLowerCase() : ""
  );
  for (const cand of candidates) {
    const idx = normalized.indexOf(cand);
    if (idx !== -1) return idx;
  }
  return null;
}

async function seedCommentsFromXlsx(filepath = "./c.xlsx") {
  const spinner = ora(`Leyendo archivo: ${filepath} ...`).start();
  try {
    const workbook = XLSX.readFile(filepath);
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      spinner.fail("El archivo no contiene hojas");
      process.exit(1);
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json<Row>(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    if (data.length === 0) {
      spinner.fail("La hoja está vacía");
      process.exit(1);
    }

    const headerRow = data[0] as Row;
    const commentCandidates = [
      "comment",
      "comments",
      "comentario",
      "comentarios",
      "texto",
      "text",
      "contenido",
      "review",
      "mensaje",
    ];
    const sourceCandidates = [
      "source",
      "fuente",
      "origen",
      "canal",
      "platform",
      "plataforma",
    ];

    const hasHeaderLikely = headerRow.some((v) => typeof v === "string" && v.trim().length > 0);
    let commentIdx = detectColumnIndex(headerRow, commentCandidates);
    let sourceIdx = detectColumnIndex(headerRow, sourceCandidates);

    let startRow = 0;
    if (commentIdx !== null || sourceIdx !== null) {
      startRow = 1; // treat first row as header
    } else {
      // fallback: assume first column is comment, second is source
      commentIdx = 0;
      sourceIdx = data[0].length > 1 ? 1 : null;
    }

    if (commentIdx === null) {
      spinner.fail(
        "No se pudo detectar la columna de comentarios. Asegúrate de que exista una columna como 'Comentario', 'Texto' o 'Content'."
      );
      process.exit(1);
    }

    const rows = data.slice(startRow);
    const rawItems = rows
      .map((row) => {
        const content = String(row[commentIdx as number] ?? "").trim();
        const source = sourceIdx != null ? String(row[sourceIdx] ?? "").trim() : "";
        return { content, source: source || null };
      })
      .filter((r) => r.content.length > 0);

    // Deduplicate within file by content+source pair
    const dedupKey = (r: { content: string; source: string | null }) => `${r.content}||${r.source ?? ""}`;
    const seen = new Set<string>();
    const items = rawItems.filter((r) => {
      const k = dedupKey(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    spinner.succeed(`Leídas ${items.length} filas de comentarios`);

    if (items.length === 0) {
      console.log(chalk.yellow("No hay comentarios para insertar"));
      return;
    }

    // Insert in batches
    const BATCH = 500;
    let inserted = 0;

    const insertBatch = async (batch: typeof items) => {
      await DB.executeTransaction(async (tx) => {
        await tx.insert(DB.schema.comments).values(
          batch.map((r) => ({ id: crypto.randomUUID(), content: r.content, source: r.source }))
        );
      });
    };

    const insertSpinner = ora("Insertando comentarios en la base de datos...").start();
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH);
      await insertBatch(batch);
      inserted += batch.length;
      insertSpinner.text = `Insertados ${inserted}/${items.length}...`;
    }
    insertSpinner.succeed(`✅ Insertados ${inserted} comentarios`);

    console.log(chalk.gray("Ejemplo (primeros 5):"));
    items.slice(0, 5).forEach((r, idx) => {
      console.log(chalk.gray(`  ${idx + 1}. ${r.content.substring(0, 80)}${r.content.length > 80 ? "..." : ""}`) + (r.source ? chalk.gray(`  [${r.source}]`) : ""));
    });
  } catch (error) {
    spinner.fail("Error leyendo o insertando comentarios");
    console.error(chalk.red("Detalles:"), error);
    process.exit(1);
  }
}

// Entry point
const inputPath = process.argv[2] || "./c.xlsx";
seedCommentsFromXlsx(inputPath);

