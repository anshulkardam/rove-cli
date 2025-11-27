import express from "express";
import helmet from "helmet";
import compression from "compression";
import { toNodeHandler } from "better-auth/node";
import config from "./config";
import cors from "cors";
import { auth } from "./lib/auth";
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// app.get("/api/me", async (req, res) => {
//   const session = await auth.api.getSession({
//     headers: fromNodeHeaders(req.headers),
//   });
//   return res.json(session);
// });

app.get("/device", async (req, res) => {
  const { user_code } = req.query;

  res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
});

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});
