import app from "./app";
import { logger } from "./lib/logger";
import { tickAutoSendQueue } from "@workspace/mwrd-shared";

const rawPort = process.env["PORT"];

// PRD: "background job in MVP: scheduled in simple setTimeout simulation".
// In Phase 2 this becomes a Supabase scheduled function / pg_cron job.
const AUTO_SEND_TICK_MS = 30_000;
setInterval(() => {
  tickAutoSendQueue().catch((err) => logger.error({ err }, "tickAutoSendQueue failed"));
}, AUTO_SEND_TICK_MS).unref();

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
