const LOG_WEBHOOK_URL = process.env.LOG_WEBHOOK_URL;

async function dispatchExternal(log) {
  if (!LOG_WEBHOOK_URL) return;
  try {
    await fetch(LOG_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
  } catch {
    // Avoid breaking request flow because of observability endpoint errors.
  }
}

export function logInfo(event, meta = {}) {
  const log = {
    level: "info",
    event,
    ts: new Date().toISOString(),
    ...meta,
  };
  console.log(JSON.stringify(log));
  dispatchExternal(log);
}

export function logError(event, error, meta = {}) {
  const log = {
    level: "error",
    event,
    ts: new Date().toISOString(),
    message: error?.message ?? "Unknown error",
    ...meta,
  };
  console.error(JSON.stringify(log));
  dispatchExternal(log);
}
