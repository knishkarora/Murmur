import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env, logger } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, type AuthedRequest } from "./middleware/auth.js";
import telegramRouter from "./routes/telegram.js";
import preferencesRouter from "./routes/preferences.js";
import profileRouter from "./routes/profile.js";
import actionsRouter from "./routes/actions.js";
import conversationsRouter from "./routes/conversations.js";
import summariesRouter from "./routes/summaries.js";
import memoriesRouter from "./routes/memories.js";
import { initScheduler } from "./services/cronService.js";

const app = express();

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
// Registered BEFORE helmet() and CORS so the cron-job.org wakeup ping gets a
// bare-minimum response (no CSP / x-frame / x-* headers from Helmet, no CORS
// headers).  Without this, the combined header + body byte count exceeds
// cron-job.org's free-tier "output too large" buffer limit.
// ──────────────────────────────────────────────────────────────────────────────
app.all(["/", "/health", "/api/health"], (req, res) => {
  if (req.method === "HEAD") {
    // Zero body bytes — absolute minimum response for HEAD-based monitors
    res.status(200).end();
    return;
  }
  if (req.query.format === "text" || req.headers.accept === "text/plain") {
    // 2-byte plain-text for cron-job.org GET pings
    res.status(200).type("text/plain").send("OK");
    return;
  }
  // Default JSON (Render's own health-check dashboard / browser)
  res.status(200).json({ status: "ok" });
});

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, server-to-server, or same-origin
      if (!origin) return callback(null, true);
      // Allow configured WEB_URL, any Render domain, Vercel domain, or localhost
      if (
        origin === env.WEB_URL ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app") ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json());

// ─── API ROUTES ───────────────────────────────────────────────────────────────
// Support both direct (/me/...) and prefixed (/api/me/...) paths
const apiRouter = express.Router();
apiRouter.use(telegramRouter);
apiRouter.use(preferencesRouter);
apiRouter.use(profileRouter);
apiRouter.use(actionsRouter);
apiRouter.use(conversationsRouter);
apiRouter.use(summariesRouter);
apiRouter.use(memoriesRouter);

app.use(apiRouter);
app.use("/api", apiRouter);

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
app.listen(port, "0.0.0.0", () => {
  logger.info(`API server running on http://0.0.0.0:${port}`);
  initScheduler();
});

export default app;
