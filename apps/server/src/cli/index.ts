#!/usr/bin/env bun

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/routers";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import Table from "cli-table3";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import type { SharedTypes } from "@/types/shared";
import * as XLSX from "xlsx";

// WebSocket client for real-time updates
class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Map<
    SharedTypes.WebSocket.EventType,
    (
      data: SharedTypes.WebSocket.EventMap[SharedTypes.WebSocket.EventType]
    ) => void
  > = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log(chalk.green("✅ Connected to WebSocket"));
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
              handler(message.data);
            }
          } catch (error) {
            console.error(chalk.red("Error parsing WebSocket message:"), error);
          }
        };

        this.ws.onerror = (error) => {
          console.error(chalk.red("WebSocket error:"), error);
        };

        this.ws.onclose = () => {
          console.log(chalk.yellow("WebSocket connection closed"));
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        chalk.yellow(
          `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        )
      );
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }

  on<
    T extends SharedTypes.WebSocket.EventType,
    M extends SharedTypes.WebSocket.EventMap[T]
  >(eventType: T, handler: (data: M["data"]) => void) {
    this.messageHandlers.set(eventType, handler);
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribeToJobs(jobIds: string[]) {
    this.send({ type: "subscribe:jobs", jobIds });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create tRPC client
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.API_URL || "http://localhost:8080/trpc",
    }),
  ],
});

// Banner
function showBanner() {
  console.clear();
  const gradient = [chalk.cyan, chalk.blue, chalk.magenta];
  console.log("\n");
  console.log(
    chalk.bold.cyan("╔════════════════════════════════════════════════╗")
  );
  console.log(
    chalk.bold.cyan("║") +
      chalk.bold.white("    🧠 ANALYZE COMMENTS MULTI-AGENT CLI        ") +
      chalk.bold.cyan("║")
  );
  console.log(
    chalk.bold.cyan("║") +
      chalk.gray("  LETI • GRO • PIX - AI-powered analysis       ") +
      chalk.bold.cyan("║")
  );
  console.log(
    chalk.bold.cyan("╚════════════════════════════════════════════════╝")
  );
  console.log("\n");
}

// Create comments
async function createComments() {
  const { mode } = await prompts({
    type: "select",
    name: "mode",
    message: "Como deseas ingresar los comentarios?",
    choices: [
      { title: "📝 Entrada manual", value: "manual" },
      { title: "📁 Importar desde archivo .txt", value: "import" },
      { title: "📊 Importar desde Excel/CSV", value: "excel" },
      { title: "📋 Pegar múltiples líneas", value: "paste" },
    ],
  });

  if (!mode) return null;

  let comments: string[] = [];

  switch (mode) {
    case "manual": {
      const { count } = await prompts({
        type: "number",
        name: "count",
        message: "Cuántos comentarios deseas crear?",
        initial: 1,
        min: 1,
        max: 100,
      });

      for (let i = 0; i < count; i++) {
        const { content } = await prompts({
          type: "text",
          name: "content",
          message: `Comentario ${i + 1}/${count}:`,
        });
        if (content && content.trim()) {
          comments.push(content.trim());
        }
      }
      break;
    }

    case "import": {
      const { filepath } = await prompts({
        type: "text",
        name: "filepath",
        message: "Ruta del archivo .txt (cada línea es un comentario):",
      });

      if (!filepath) return null;

      if (!existsSync(filepath)) {
        console.log(chalk.red("❌ El archivo no existe"));
        return null;
      }

      const spinner = ora("Leyendo archivo...").start();
      try {
        const fileContent = await readFile(filepath, "utf-8");
        comments = fileContent
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        spinner.succeed(`Cargados ${comments.length} comentarios del archivo`);

        // Mostrar preview
        console.log(chalk.blue("\n📄 Vista previa:"));
        const preview = comments.slice(0, 5);
        preview.forEach((comment, i) => {
          const truncated =
            comment.length > 80 ? comment.substring(0, 77) + "..." : comment;
          console.log(chalk.gray(`  ${i + 1}. ${truncated}`));
        });
        if (comments.length > 5) {
          console.log(chalk.gray(`  ... y ${comments.length - 5} más`));
        }

        const { confirm } = await prompts({
          type: "confirm",
          name: "confirm",
          message: "Proceder con estos comentarios?",
          initial: true,
        });

        if (!confirm) return null;
      } catch (error) {
        spinner.fail("Error al leer el archivo");
        console.error(error);
        return null;
      }
      break;
    }

    case "excel": {
      const { filepath } = await prompts({
        type: "text",
        name: "filepath",
        message: "Ruta del archivo Excel/CSV (.xlsx, .xls, .csv):",
      });

      if (!filepath) return null;

      if (!existsSync(filepath)) {
        console.log(chalk.red("❌ El archivo no existe"));
        return null;
      }

      // Detectar la extensión del archivo
      const extension = filepath.toLowerCase().split(".").pop();
      if (!["xlsx", "xls", "csv"].includes(extension || "")) {
        console.log(
          chalk.red("❌ Formato no soportado. Usa .xlsx, .xls o .csv")
        );
        return null;
      }

      const spinner = ora("Leyendo archivo Excel/CSV...").start();
      try {
        // Leer el archivo con XLSX
        const workbook = XLSX.readFile(filepath);
        console.log(workbook);

        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          spinner.fail("El archivo no contiene hojas");
          return null;
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON (array de arrays)
        const data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Usar array en lugar de objetos
          defval: "", // Valor por defecto para celdas vacías
        }) as string[][];

        // Extraer comentarios de la primera columna (ignorando encabezados si los hay)
        const { hasHeader } = await prompts({
          type: "confirm",
          name: "hasHeader",
          message: "¿La primera fila contiene encabezados?",
          initial: true,
        });

        const startRow = hasHeader ? 1 : 0;
        comments = data
          .slice(startRow)
          .map((row) => String(row[0] || "").trim())
          .filter((comment) => comment.length > 0);

        if (comments.length === 0) {
          spinner.fail("No se encontraron comentarios en el archivo");
          return null;
        }

        spinner.succeed(
          `Cargados ${comments.length} comentarios del archivo Excel/CSV`
        );

        // Mostrar preview
        console.log(chalk.blue("\n📄 Vista previa:"));
        const preview = comments.slice(0, 5);
        preview.forEach((comment, i) => {
          const truncated =
            comment.length > 80 ? comment.substring(0, 77) + "..." : comment;
          console.log(chalk.gray(`  ${i + 1}. ${truncated}`));
        });
        if (comments.length > 5) {
          console.log(chalk.gray(`  ... y ${comments.length - 5} más`));
        }

        // Si hay múltiples columnas, mostrar información adicional
        if (data.length > 0 && data[0].length > 1) {
          console.log(
            chalk.yellow(
              `\n⚠ Nota: Se detectaron ${data[0].length} columnas. Solo se importará la primera columna.`
            )
          );
        }

        const { confirm } = await prompts({
          type: "confirm",
          name: "confirm",
          message: "Proceder con estos comentarios?",
          initial: true,
        });

        if (!confirm) return null;
      } catch (error) {
        spinner.fail("Error al leer el archivo Excel/CSV");
        console.error(error);
        return null;
      }
      break;
    }

    case "paste": {
      console.log(
        chalk.cyan(
          "Pega los comentarios (uno por línea), luego presiona CTRL+D:"
        )
      );
      const { multiline } = await prompts({
        type: "text",
        name: "multiline",
        message: "Comentarios:",
        multiline: true,
      });

      if (!multiline) return null;

      comments = multiline
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      console.log(chalk.green(`✓ ${comments.length} comentarios ingresados`));
      break;
    }
  }

  if (comments.length === 0) {
    console.log(chalk.yellow("⚠ No se ingresaron comentarios"));
    return null;
  }

  // Guardar comentarios en la base de datos
  const spinner = ora("Guardando comentarios en la base de datos...").start();
  try {
    const result = await trpc.comments.create.mutate({
      comments: comments.map((content) => ({ content })),
    });

    spinner.succeed(`✅ ${result.comments.length} comentarios guardados`);

    // Mostrar tabla con resumen
    const table = new Table({
      head: [chalk.cyan("Métrica"), chalk.cyan("Valor")],
      style: { head: [], border: [] },
    });

    table.push(
      ["Total guardados", chalk.green(result.comments.length.toString())],
      ["IDs generados", chalk.gray("✓")],
      ["Estado", chalk.green("Listos para procesar")]
    );

    console.log("\n" + table.toString());

    return {
      commentIds: result.comments.map((comment) => comment.commentId),
      comments: result.comments,
    };
  } catch (error) {
    spinner.fail("Error al guardar comentarios");
    console.error(chalk.red("Detalles:"), error);
    return null;
  }
}

// Process and monitor comments
async function processAndMonitor(commentIds: string[]) {
  const spinner = ora(
    "Enviando comentarios para análisis multi-agente con IA..."
  ).start();

  try {
    // Llamar tRPC para procesar comentarios
    const result = await trpc.processing.analyzeComments.mutate({
      commentIds,
    });

    spinner.succeed(chalk.green("✅ " + result.message));

    // Mostrar detalles del job con tabla mejorada
    const table = new Table({
      head: [chalk.bold.cyan("Métrica"), chalk.bold.cyan("Valor")],
      style: {
        head: [],
        border: [],
        "padding-left": 1,
        "padding-right": 1,
      },
    });

    table.push(
      ["📝 Total Comentarios", chalk.yellow(result.details.totalComments)],
      ["📦 Tamaño de Batch", chalk.blue(result.details.batchSize)],
      ["⚙️  Jobs Creados", chalk.green(result.details.jobsCreated)],
      ["🚀 Estado", chalk.green("En proceso")]
    );

    console.log("\n" + table.toString());

    // Conectar a WebSocket para monitoreo
    console.log(chalk.blue("\n📡 Conectando al stream en tiempo real..."));
    const ws = new WebSocketClient("ws://localhost:8080");

    await ws.connect();

    // Suscribirse a eventos de jobs
    const jobIds = result.details.batches.map((_, index) => `job-${index}`);
    ws.subscribeToJobs(jobIds);

    // Configurar manejadores con formato mejorado
    const progressData = new Map<string, any>();
    let completedJobs = 0;
    let totalInsightsCreated = 0;
    let totalInsightsMatched = 0;
    let totalIntentionsDetected = 0;
    let totalSentimentsAnalyzed = 0;

    ws.on("state:changed", (data) => {
      progressData.set(data.jobId, {
        state: data.state,
        progress: data.progress || 0,
      });

      displayProgressLive(progressData, jobIds.length);
    });

    ws.on("job:completed", (data) => {
      completedJobs++;
      totalInsightsCreated += data.result.createdInsights || 0;
      totalInsightsMatched += data.result.matchedInsights || 0;

      console.log(chalk.green(`\n✅ Job ${data.jobId} completado`));
      console.log(
        chalk.gray(
          `   📊 ${data.result.processedComments} comentarios procesados`
        )
      );
      console.log(
        chalk.gray(`   🔗 ${data.result.matchedInsights} insights coincidentes`)
      );
      console.log(
        chalk.gray(
          `   💡 ${data.result.createdInsights} nuevos insights creados`
        )
      );
    });

    ws.on("job:failed", (data) => {
      console.log(chalk.red(`\n❌ Job ${data.jobId} falló`));
      console.log(chalk.red(`   Error: ${data.error || "Error desconocido"}`));
    });

    // LETI Agent Events
    ws.on("leti:started", (data) => {
      console.log(
        chalk.cyan(
          `\n🔍 LETI Agent iniciado: ${data.commentCount} comentarios, ${data.existingInsightCount} insights existentes`
        )
      );
    });

    ws.on("leti:insight:detected", (data) => {
      const icon = data.isEmergent ? "✨" : "🔗";
      console.log(
        chalk.blue(
          `${icon} Insight detectado: ${chalk.white(
            data.insightName
          )} (confianza: ${data.confidence})`
        )
      );
    });

    ws.on("leti:insight:created", (data) => {
      console.log(
        chalk.magenta(
          `💡 Nuevo insight creado: ${chalk.bold.white(data.insightName)}`
        )
      );
      if (data.description) {
        console.log(chalk.gray(`   ${data.description}`));
      }
    });

    ws.on("leti:completed", (data) => {
      totalInsightsCreated += data.newInsightsCreated;
      console.log(
        chalk.green(
          `✅ LETI completado: ${data.totalDetected} insights detectados, ${data.newInsightsCreated} nuevos`
        )
      );
    });

    // GRO Agent Events
    ws.on("gro:started", (data) => {
      console.log(
        chalk.yellow(
          `\n🎯 GRO Agent iniciado: analizando intenciones en ${data.commentCount} comentarios`
        )
      );
    });

    ws.on("gro:intention:detected", (data) => {
      console.log(
        chalk.yellow(
          `🎯 Intención: ${data.primaryIntention} (confianza: ${data.confidence})`
        )
      );
    });

    ws.on("gro:completed", (data) => {
      totalIntentionsDetected += data.totalProcessed;
      console.log(
        chalk.green(
          `✅ GRO completado: ${data.totalProcessed} intenciones detectadas`
        )
      );
    });

    // PIX Agent Events
    ws.on("pix:started", (data) => {
      console.log(
        chalk.magenta(
          `\n😊 PIX Agent iniciado: analizando sentimiento en ${data.pairsToAnalyze} pares`
        )
      );
    });

    ws.on("pix:sentiment:analyzed", (data) => {
      const emoji =
        data.intensityValue > 0 ? "😊" : data.intensityValue < 0 ? "😔" : "😐";
      console.log(
        chalk.magenta(
          `${emoji} Sentimiento: ${data.sentimentLevel} (${data.insightName})` +
            `\nConfianza: ${data.confidence}` +
            `\nDrivers: ${data.emotionalDrivers.join(", ")}` +
            `\nRazón: ${data.reasoning}`
        )
      );
    });

    ws.on("pix:completed", (data) => {
      totalSentimentsAnalyzed += data.totalAnalyzed;
      console.log(
        chalk.green(
          `✅ PIX completado: ${data.totalAnalyzed} sentimientos analizados`
        )
      );
    });

    // Esperar completación o interrupción del usuario
    await new Promise((resolve) => {
      const checkCompletion = setInterval(() => {
        if (completedJobs >= jobIds.length) {
          clearInterval(checkCompletion);

          // Mostrar resumen final
          console.log(chalk.bold.green("\n\n✨ Procesamiento completado!"));

          const summaryTable = new Table({
            head: [chalk.bold.cyan("Resumen Final"), chalk.bold.cyan("Valor")],
            style: { head: [], border: [] },
          });

          summaryTable.push(
            [
              "💼 Jobs completados",
              chalk.green(completedJobs + "/" + jobIds.length),
            ],
            [
              "💡 Nuevos insights",
              chalk.magenta(totalInsightsCreated.toString()),
            ],
            [
              "🔗 Insights detectados",
              chalk.blue(totalInsightsMatched.toString()),
            ],
            [
              "🎯 Intenciones detectadas",
              chalk.yellow(totalIntentionsDetected.toString()),
            ],
            [
              "😊 Sentimientos analizados",
              chalk.cyan(totalSentimentsAnalyzed.toString()),
            ],
            [
              "📊 Total procesado",
              chalk.yellow(result.details.totalComments + " comentarios"),
            ]
          );

          console.log("\n" + summaryTable.toString());
          resolve(true);
        }
      }, 1000);

      // Permitir interrupción manual
      setTimeout(() => {
        if (completedJobs < jobIds.length) {
          console.log(
            chalk.yellow(
              "\n\n⚠ Tiempo de espera agotado. Algunos jobs pueden seguir procesándose en segundo plano."
            )
          );
          clearInterval(checkCompletion);
          resolve(false);
        }
      }, 60000); // Timeout de 60 segundos
    });

    ws.disconnect();
  } catch (error) {
    spinner.fail("Error al procesar comentarios");
    console.error(chalk.red("Error:"), error);
  }
}

// Display progress in real-time
function displayProgressLive(progressMap: Map<string, any>, totalJobs: number) {
  // No limpiar toda la pantalla, solo actualizar la línea
  process.stdout.write("\r");

  let completed = 0;
  let failed = 0;
  let processing = 0;

  for (const [_, data] of progressMap.entries()) {
    if (data.state === "completed") completed++;
    else if (data.state === "failed") failed++;
    else processing++;
  }

  const progressBar = createProgressBar((completed / totalJobs) * 100, 30);

  process.stdout.write(
    chalk.cyan("Progreso: ") +
      progressBar +
      chalk.yellow(` ${completed}/${totalJobs} `) +
      (failed > 0 ? chalk.red(`[${failed} errores] `) : "") +
      (processing > 0 ? chalk.blue(`[${processing} en proceso]`) : "")
  );
}

// Create progress bar
function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;
  return chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
}

// View insights
async function viewInsights() {
  const spinner = ora("Cargando insights...").start();

  try {
    // Obtener insights reales de la base de datos
    const { insights, pagination } = await trpc.insights.list.query({
      limit: 50,
      offset: 0,
    });

    spinner.succeed(`${insights.length} insights cargados`);

    if (insights.length === 0) {
      console.log(chalk.yellow("\n⚠ No hay insights en la base de datos"));
      return;
    }

    // Crear tabla con estilo mejorado
    const table = new Table({
      head: [
        chalk.bold.cyan("ID"),
        chalk.bold.cyan("Nombre"),
        chalk.bold.cyan("Descripción"),
        chalk.bold.cyan("Comentarios"),
        chalk.bold.cyan("IA"),
        chalk.bold.cyan("Creado"),
      ],
      style: {
        head: [],
        border: [],
        "padding-left": 1,
        "padding-right": 1,
      },
      colWidths: [6, 25, 30, 12, 5, 12],
      wordWrap: true,
    });

    insights.forEach((insight) => {
      const createdDate = new Date(insight.created_at).toLocaleDateString();
      const name =
        insight.name.length > 23
          ? insight.name.substring(0, 20) + "..."
          : insight.name;
      const desc = insight.description
        ? insight.description.length > 28
          ? insight.description.substring(0, 25) + "..."
          : insight.description
        : chalk.gray("Sin descripción");

      table.push([
        chalk.yellow(insight.id.toString()),
        chalk.white(name),
        chalk.gray(desc),
        chalk.blue(insight.commentCount.toString()),
        insight.ai_generated ? chalk.green("✓") : chalk.gray("✗"),
        chalk.gray(createdDate),
      ]);
    });

    console.log("\n" + table.toString());

    // Mostrar estadísticas
    const stats = await trpc.insights.stats.query();

    console.log(chalk.bold.blue("\n📊 Estadísticas:"));
    const statsTable = new Table({
      style: { head: [], border: [] },
    });

    statsTable.push(
      [
        chalk.cyan("Total Insights:"),
        chalk.white(stats.totalInsights.toString()),
      ],
      [
        chalk.cyan("Generados por IA:"),
        chalk.green(stats.aiGeneratedInsights.toString()),
      ],
      [chalk.cyan("Manuales:"), chalk.yellow(stats.manualInsights.toString())],
      [
        chalk.cyan("Promedio comentarios:"),
        chalk.blue(stats.avgCommentsPerInsight.toString()),
      ],
      [
        chalk.cyan("Últimas 24h:"),
        chalk.magenta(stats.recentInsights.toString()),
      ],
      [chalk.cyan("Tasa IA:"), chalk.white(`${stats.aiGenerationRate}%`)]
    );

    console.log(statsTable.toString());

    if (pagination.hasMore) {
      console.log(
        chalk.gray(`\n... y ${pagination.total - insights.length} más`)
      );
    }
  } catch (error) {
    spinner.fail("Error al cargar insights");
    console.error(chalk.red("Detalles:"), error);
  }
}

// Monitor en tiempo real simplificado
async function realtimeMonitor() {
  const spinner = ora("Conectando al stream en tiempo real...").start();
  const ws = new WebSocketClient("ws://localhost:8080");

  try {
    await ws.connect();
    spinner.succeed("Conectado al monitor en tiempo real");

    console.log(chalk.gray("\nMonitoreando todos los eventos del sistema..."));
    console.log(chalk.gray("Presiona Ctrl+C para detener\n"));

    // Tabla de eventos en tiempo real
    const eventLog: string[] = [];
    const maxEvents = 20;

    const updateDisplay = () => {
      console.clear();
      showBanner();
      console.log(chalk.bold.blue("📡 Monitor en Tiempo Real\n"));

      eventLog.forEach((event) => console.log(event));

      console.log(chalk.gray("\n" + "─".repeat(50)));
      console.log(chalk.gray("Presiona Ctrl+C para salir"));
    };

    const addEvent = (message: string) => {
      const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
      eventLog.push(`${timestamp} ${message}`);
      if (eventLog.length > maxEvents) eventLog.shift();
      updateDisplay();
    };

    // Configurar manejadores de eventos
    ws.on("job:started", (data) => {
      addEvent(chalk.cyan(`⚙️  Job iniciado: ${data.jobId}`));
    });

    ws.on("state:changed", (data) => {
      const stateMsg =
        data.state === "analyzing"
          ? "🔄 Analizando"
          : data.state === "completed"
          ? "✅ Completado"
          : data.state === "failed"
          ? "❌ Fallido"
          : "⏳ En espera";
      addEvent(`${stateMsg}: ${data.jobId} (${data.progress || 0}%)`);
    });

    // LETI Events
    ws.on("leti:insight:detected", (data) => {
      const icon = data.isEmergent ? "✨" : "🔗";
      addEvent(chalk.blue(`${icon} LETI: ${data.insightName}`));
    });

    ws.on("leti:insight:created", (data) => {
      addEvent(chalk.magenta(`💡 LETI nuevo: ${data.insightName}`));
    });

    // GRO Events
    ws.on(
      "gro:intention:detected",
      (
        data: SharedTypes.WebSocket.EventMap["gro:intention:detected"]["data"]
      ) => {
        addEvent(chalk.yellow(`🎯 GRO: ${data.primaryIntention}`));
      }
    );

    // PIX Events
    ws.on("pix:sentiment:analyzed", (data) => {
      const emoji =
        data.intensityValue > 0 ? "😊" : data.intensityValue < 0 ? "😔" : "😐";
      addEvent(chalk.cyan(`${emoji} PIX: ${data.sentimentLevel}`));
    });

    ws.on("job:completed", (data) => {
      addEvent(
        chalk.green(
          `✨ Job completado: ${data.result.processedComments} comentarios`
        )
      );
    });

    // Mantener abierto hasta interrupción
    await new Promise(() => {});
  } catch (error) {
    spinner.fail("Error al conectar");
    console.error(chalk.red("Detalles:"), error);
  }
}

// Menú principal
async function main() {
  showBanner();

  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "¿Qué deseas hacer?",
      choices: [
        { title: "💬 Crear y Procesar Comentarios", value: "create" },
        { title: "🧠 Ver Insights", value: "insights" },
        { title: "📡 Monitor en Tiempo Real", value: "monitor" },
        { title: "📊 Ver Estadísticas", value: "stats" },
        { title: "👋 Salir", value: "exit" },
      ],
    });

    if (!action || action === "exit") {
      console.log(chalk.cyan("\n✨ ¡Hasta luego!\n"));
      break;
    }

    console.log();

    switch (action) {
      case "create": {
        const result = await createComments();
        if (result && result.commentIds.length > 0) {
          const { process } = await prompts({
            type: "confirm",
            name: "process",
            message: "¿Deseas procesar estos comentarios con IA ahora?",
            initial: true,
          });

          if (process) {
            await processAndMonitor(result.commentIds);
          }
        }
        break;
      }

      case "insights":
        await viewInsights();
        break;

      case "monitor":
        await realtimeMonitor();
        break;

      case "stats":
        await showStats();
        break;
    }

    console.log();

    const { continueApp } = await prompts({
      type: "confirm",
      name: "continueApp",
      message: "¿Volver al menú principal?",
      initial: true,
    });

    if (!continueApp) {
      console.log(chalk.cyan("\n✨ ¡Hasta luego!\n"));
      break;
    }

    showBanner();
  }

  process.exit(0);
}

// Mostrar estadísticas generales
async function showStats() {
  const spinner = ora("Cargando estadísticas...").start();

  try {
    const stats = await trpc.insights.stats.query();
    spinner.succeed("Estadísticas cargadas");

    console.log(chalk.bold.blue("\n📊 ESTADÍSTICAS DEL SISTEMA\n"));

    const table = new Table({
      style: {
        head: [],
        border: [],
        "padding-left": 2,
        "padding-right": 2,
      },
    });

    table.push(
      [
        chalk.cyan("📚 Total Insights"),
        chalk.bold.white(stats.totalInsights.toString()),
      ],
      ["", ""],
      [
        chalk.cyan("🤖 Generados por IA"),
        chalk.green(stats.aiGeneratedInsights.toString()),
      ],
      [
        chalk.cyan("✍️  Manuales"),
        chalk.yellow(stats.manualInsights.toString()),
      ],
      [chalk.cyan("📈 Tasa de IA"), chalk.white(`${stats.aiGenerationRate}%`)],
      ["", ""],
      [
        chalk.cyan("💬 Promedio comentarios/insight"),
        chalk.blue(stats.avgCommentsPerInsight.toString()),
      ],
      [
        chalk.cyan("🆕 Últimas 24 horas"),
        chalk.magenta(stats.recentInsights.toString()),
      ]
    );

    console.log(table.toString());

    // Gráfico de barras simple
    console.log(chalk.bold.blue("\n📈 Distribución:\n"));
    const aiBar = createProgressBar(stats.aiGenerationRate, 40);
    console.log(`  IA:     ${aiBar} ${stats.aiGenerationRate}%`);
    const manualBar = createProgressBar(100 - stats.aiGenerationRate, 40);
    console.log(`  Manual: ${manualBar} ${100 - stats.aiGenerationRate}%`);
  } catch (error) {
    spinner.fail("Error al cargar estadísticas");
    console.error(chalk.red("Detalles:"), error);
  }
}

// Manejo de errores e interrupciones
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n👋 Interrupción detectada. Cerrando...\n"));
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error(chalk.red("\n❌ Error no manejado:"), error);
  process.exit(1);
});

// Ejecutar CLI
main().catch((error) => {
  console.error(chalk.red("❌ Error fatal:"), error);
  process.exit(1);
});
