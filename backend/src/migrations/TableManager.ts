import { db } from "../utils/database";

class TableManager {
	async createTables() {
		// TODO
	}
}

const tableManager = new TableManager();
tableManager
	.createTables()
	.then(() => console.log("Tables created"))
	.catch(console.error);
