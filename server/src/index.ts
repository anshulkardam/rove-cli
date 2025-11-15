import express from "express";
import helmet from "helmet";
import compression from "compression";
import config from "./config";
import cors from 'cors'
const app = express();

app.use(helmet());

app.use(cors())

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(compression());

app.get("/", (req, res) => {
  res.json({ message: "Hello Mambo" });
});

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});
