import { TableManager } from "./TableManager";
import { db } from "./database";

const tableManager = new TableManager();
tableManager
	.createDBTables(db)
	.then(() => console.log("Tables created"))
	.catch(console.error);
