import { env, exit } from "node:process";

import { buildApp } from "./app.js";

function readPort(value: string | undefined): number {
  const parsed = Number(value ?? "4000");

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    return 4000;
  }

  return parsed;
}

const app = await buildApp({ logger: true });
const host = env.HOST ?? "127.0.0.1";
const port = readPort(env.PORT);

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  exit(1);
}
