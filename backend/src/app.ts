import express, { type Express, Request, Response } from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import { authRouter } from "./routers/auth";
import { stockRouter } from "./routers/stock";
import cors from "cors";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// application/json parser
app.use(bodyParser.json());

// application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
	cors({
		origin: "http://localhost:4200",
		credentials: true,
	}),
);

app.use("/api/auth", authRouter);
app.use("/api/stock", stockRouter);

app.listen(PORT, () => {
	console.log("HTTP server on http://localhost:%s", PORT);
});
