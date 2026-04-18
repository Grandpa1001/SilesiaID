import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nipRouter from "./routes/nip";
import issueRouter from "./routes/issue";
import verifyRouter from "./routes/verify";
import myCertRouter from "./routes/myCert";
import revokeRouter from "./routes/revoke";
import institutionAuthRouter from "./routes/institutionAuth";
import institutionVerifyRouter from "./routes/institutionVerify";
import { initDB } from "./db/schema";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", nipRouter);
app.use("/api/v1", issueRouter);
app.use("/api/v1", verifyRouter);
app.use("/api/v1", myCertRouter);
app.use("/api/v1", revokeRouter);
app.use("/api/v1/institution", institutionAuthRouter);
app.use("/api/v1/institution", institutionVerifyRouter);

initDB();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

export default app;
