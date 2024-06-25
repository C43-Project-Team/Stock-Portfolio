import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import "dotenv/config";

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log("HTTP server on http://localhost:%s", PORT);
});
