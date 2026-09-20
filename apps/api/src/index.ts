import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env, logger } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, type AuthedRequest } from "./middleware/auth.js";
import telegramRouter from "./routes/telegram.js";
import preferencesRouter from "./routes/preferences.js";
import { initScheduler } from "./services/cronService.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Telegram routes (link generation & webhook ingestion)
app.use(telegramRouter);

// User preferences routes
app.use(preferencesRouter);

// Public health check route
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString(),
  });
});

// Authenticated user check route
app.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({
    status: "ok",
    userId: req.userId,
  });
});

// Error handling middleware
app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
  logger.info(`API server running on http://localhost:${port}`);
  initScheduler();
});

export default app;
