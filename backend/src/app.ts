import express, { type Express, Request, Response } from "express";
import bodyParser from "body-parser";
import "dotenv/config";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// application/json parser
app.use(bodyParser.json());

// application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(PORT, () => {
	console.log("HTTP server on http://localhost:%s", PORT);
});
