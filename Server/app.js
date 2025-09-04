import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/bookings", bookingsRoutes);

// error handler (last)
app.use(errorHandler);

export default app;
