import { printStoreContents } from "../../redis/controller";

printStoreContents().then(() => {
  console.log("All contents have been printed.");
  process.exit(0)
});