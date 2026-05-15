import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: { app: "pinkevo-os" },
  redact: {
    paths: [
      "req.headers.authorization",
      "*.password",
      "*.api_key",
      "*.access_token",
      "*.refresh_token",
    ],
    censor: "[REDACTED]",
  },
});
