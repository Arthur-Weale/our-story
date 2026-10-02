import cors from "cors";
import express from "express";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAnswer,
  saveAnswer,
  unlockProposal,
} from "./controller/proposal.js";

const app = express();

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

app.use(
  cors({
    origin(origin, callback) {
      const isLocalPreview =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin ?? "");

      callback(null, isLocalPreview ? origin : false);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

app.get("/api/proposal", getAnswer);
app.post("/api/proposal", saveAnswer);
app.post("/api/unlock", unlockProposal);

app.get("/", (req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(projectRoot, "styles.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(projectRoot, "script.js"));
});

app.use("/assets", express.static(path.join(projectRoot, "assets")));
app.use("/data", express.static(path.join(projectRoot, "data")));

export default app;
