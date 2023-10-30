import "dotenv/config";

import Link from "grenache-nodejs-link";

export default new Link({
  grape: process.env.GRAPE_API_ENDPOINT,
});
