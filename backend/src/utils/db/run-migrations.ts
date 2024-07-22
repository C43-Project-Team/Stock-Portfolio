import { TableManager } from "./TableManager";
import { db } from "./db-controller";

const tableManager = new TableManager();
tableManager
	.runMigrations(db)
	.then(() => console.log("Migrations applied successfully"))
	.catch(console.error);
