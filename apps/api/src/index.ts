import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env, logger } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Public health check route
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
  logger.info(`API server running on http://localhost:${port}`);
});

export default app;
