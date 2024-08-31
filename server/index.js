import express from 'express';
import expressWs from 'express-ws';
import Sqlite3 from 'better-sqlite3';
import yargs from "yargs";

import config from './config.js';

export const argv = yargs(process.argv)
	.option("prod", {
		alias: "p",
		description: "Run in production mode",
		type: "boolean",
		default: false,
	})
	.help()
	.alias("help", "h").argv;

import { Core } from './Core.js';

export const db = new Sqlite3(config.dbPath);
db.pragma('foreign_keys = ON');
export const app = express();
expressWs(app);
app.use(express.json());
const httpServer = createServer(app);
export const io = new Server(httpServer, { 
	cors: {
		origin: "*",
	}, 
});
export const core = new Core();


httpServer.listen(config.port, () => {
	console.log("Server running on port " + config.port);
});