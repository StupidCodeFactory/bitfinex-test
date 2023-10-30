import "dotenv/config";

import { PeerRPCServer } from "grenache-nodejs-http";

export const buildService = (link) => {
  const server = new PeerRPCServer(link, {
    timeout: 300000,
  });
  server.init();
  const service = server.transport("bufffer");
  service.listen(parseInt(process.env.ORDER_BOOK_SERVICE_PORT));
  return service;
};
