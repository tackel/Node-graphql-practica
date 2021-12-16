import { connect } from "./config/typeorm";
import { startServer } from "./server";

async function main() {
  connect();
  const port: number = 4000; // esto deberia ir en las variables de entorno
  const app = await startServer();
  app.listen(port);
  console.log(`App is running at port: ${port} `);
}

main();
