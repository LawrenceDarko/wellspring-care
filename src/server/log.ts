import "server-only";

// PRD §13.6: structured logger with a field allowlist. Anything not listed is
// dropped (only a count of dropped keys is kept). Values must be primitives;
// objects, arrays and Errors are dropped so sensitive content cannot ride along.

export const LOG_FIELDS = [
  "requestId",
  "route",
  "method",
  "status",
  "durationMs",
  "userId",
  "action",
  "targetType",
  "targetId",
  "collection",
  "integration",
  "kid",
  "count",
  "errorName",
  "errorCode",
] as const;
export type LogField = (typeof LOG_FIELDS)[number];
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogValue = string | number | boolean | null;
export type LogFields = Partial<Record<LogField, unknown>> & Record<string, unknown>;

const ALLOWED = new Set<string>(LOG_FIELDS);
const MAX_STRING = 200;

export type LogRecord = { level: LogLevel; event: string; time: string; dropped?: number } & Partial<
  Record<LogField, LogValue>
>;

/** Keeps allowlisted keys with primitive values; strips query strings from `route`. */
export function sanitizeLogFields(fields: Record<string, unknown> = {}): {
  kept: Partial<Record<LogField, LogValue>>;
  dropped: number;
} {
  const kept: Partial<Record<LogField, LogValue>> = {};
  let dropped = 0;
  for (const [key, raw] of Object.entries(fields)) {
    if (!ALLOWED.has(key) || !isPrimitive(raw)) {
      dropped++;
      continue;
    }
    let value = raw;
    if (typeof value === "string") {
      if (key === "route") value = value.split(/[?#]/, 1)[0];
      value = value.slice(0, MAX_STRING);
    }
    kept[key as LogField] = value;
  }
  return { kept, dropped };
}

function isPrimitive(v: unknown): v is LogValue {
  return v === null || typeof v === "string" || typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v));
}

export type LogSink = (record: LogRecord) => void;

const consoleSink: LogSink = (record) => {
  const line = JSON.stringify(record);
  if (record.level === "error" || record.level === "warn") console.error(line);
  else console.log(line);
};

export function createLogger(sink: LogSink = consoleSink) {
  const write = (level: LogLevel, event: string, fields?: LogFields) => {
    const { kept, dropped } = sanitizeLogFields(fields);
    const record: LogRecord = { level, event: event.slice(0, 100), time: new Date().toISOString(), ...kept };
    if (dropped) record.dropped = dropped;
    sink(record);
  };
  return {
    debug: (event: string, fields?: LogFields) => write("debug", event, fields),
    info: (event: string, fields?: LogFields) => write("info", event, fields),
    warn: (event: string, fields?: LogFields) => write("warn", event, fields),
    error: (event: string, fields?: LogFields) => write("error", event, fields),
  };
}

export type Logger = ReturnType<typeof createLogger>;

export const log: Logger = createLogger();

/** Error fields safe to log: the name only (messages can carry user data). */
export function errorFields(err: unknown): { errorName: string } {
  return { errorName: err instanceof Error ? err.name : typeof err };
}
