import { TableManager } from "./TableManager";
import { db } from "./db-controller";

const tableManager = new TableManager();
tableManager
	.createIndexes(db)
	.then(() => console.log("Indexes created"))
	.catch(console.error);
