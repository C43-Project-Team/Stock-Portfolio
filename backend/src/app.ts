import express, { type Express, Request, Response } from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import { authRouter } from "@routers/auth";
import { stockRouter } from "@routers/stock";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import friendsRouter from "@routers/friends";
import { userRouter } from "@routers/user";
import { stockListRouter } from "@routers/stock_list";
import { portfolioRouter } from "./routers/portfolio";

const app: Express = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4200";
console.log("FRONTEND_URL: ", FRONTEND_URL);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// application/json parser
app.use(bodyParser.json());

// application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));


app.use("/api/auth", authRouter);
app.use("/api/stock", stockRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/user", userRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/stock-list", stockListRouter);

app.use("/api/uploads", express.static(path.join(__dirname, "./uploads")));

app.listen(PORT, () => {
	console.log("HTTP server on http://localhost:%s", PORT);
});
