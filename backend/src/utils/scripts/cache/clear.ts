import { clearCache } from "../../redis/controller";

clearCache().then(
  () => {
    console.log("The cache has been cleared.");
    process.exit(0);
  }
)