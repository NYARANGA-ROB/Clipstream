const app = require("./app");
const { log } = require("./config/logger");
const { ensureDemoUsers } = require("./scripts/ensure-demo-users");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  log.serverStart(PORT);
  ensureDemoUsers().catch((error) => {
    console.error("Could not ensure demo users:", error.message);
  });
});

const shutdown = () => {
  log.serverShutdown();
  server.close(() => {
    log.serverClosed();
    process.exit(0);
  });

  setTimeout(() => {
    log.serverForceExit();
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
