import { TableManager } from "./TableManager";
import { db } from "./database";

const tableManager = new TableManager();
tableManager
	.runMigrations(db)
	.then(() => console.log("Migrations applied successfully"))
	.catch(console.error);
