import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import { Client } from "discord.js";

import { IntentOptions } from "./config/IntentOptions";
import { onMessage } from "./events/onMessage";
import { onReady } from "./events/onReady";
import { ExtendedClientInterface } from "./interfaces/ExtendedClientInterface";
import { startServer } from "./server/startServer";
import { errorHandler } from "./utils/errorHandler";
import { logHandler } from "./utils/logHandler";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: global.__dirname,
    }),
  ],
});

(async () => {
  try {
    const client = new Client({
      intents: IntentOptions,
    }) as ExtendedClientInterface;
    const token = process.env.TOKEN;

    client.timer = 0;
    const cooldown = parseInt(process.env.COOLDOWN || "30000");
    client.cooldown = isNaN(cooldown) ? 30000 : cooldown;

    if (!token) {
      logHandler.log("error", "Missing Discord Token");
      process.exit(1);
    }

    client.on(
      "messageCreate",
      async (message) => await onMessage(message, client)
    );

    client.on("ready", () => onReady(client));

    await client.login(token);

    await startServer();
  } catch (err) {
    errorHandler("initialisation", err);
  }
})();
