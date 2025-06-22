import BaseExtension from "./BaseExtension.js";
import { Router } from "express";
import fs from "fs/promises";

import { argv, app, core, db } from "./index.js";

import api from "./api/index.js";

export default class WebUI extends BaseExtension {
	constructor() {
		super();

		this.serverState = {};
	}

	async mount() {
		db.prepare(
			`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, password TEXT, blocked INTEGER)`,
		).run();
		db.prepare(
			`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT, token TEXT, expires INTEGER, description TEXT, has_undelivered_notifications INTEGER, FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE, UNIQUE(token))`,
		).run();
		db.prepare(
			`CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT, can_be_toggled INTEGER)`,
		).run();
		db.prepare(
			`CREATE TABLE IF NOT EXISTS users_roles (user_id TEXT, role_id TEXT, active INTEGER, PRIMARY KEY(user_id, role_id), FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY(role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE)`,
		).run();
		db.prepare(
			`INSERT OR IGNORE INTO roles (id, name, can_be_toggled) VALUES ('admin', 'Administrator', 0)`,
		).run();
		db.prepare(
			`INSERT OR IGNORE INTO roles (id, name, can_be_toggled) VALUES ('user', 'User', 0)`,
		).run();
		db.prepare(
			`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, type TEXT, title TEXT, message TEXT, time INTEGER, extra TEXT, deleted INTEGER DEFAULT 0)`,
		).run();
		db.prepare(
			`CREATE TABLE IF NOT EXISTS notifications_to (notification_id TEXT, user_id TEXT, viewed INTEGER, FOREIGN KEY(notification_id) REFERENCES notifications(id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE, PRIMARY KEY(notification_id, user_id))`,
		).run();
		db.prepare(
			`CREATE TABLE IF NOT EXISTS notifications_delivery (notification_id TEXT, user_id TEXT, session_id TEXT, delivered INTEGER, FOREIGN KEY(notification_id, user_id) REFERENCES notifications_to(notification_id, user_id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY(session_id) REFERENCES sessions(id) ON UPDATE CASCADE ON DELETE CASCADE, PRIMARY KEY(notification_id, user_id, session_id))`,
		).run();
		db.prepare(
			`CREATE TRIGGER IF NOT EXISTS notifications_to_insert AFTER INSERT ON notifications_to BEGIN INSERT INTO notifications_delivery (notification_id, user_id, session_id, delivered) VALUES (NEW.notification_id, NEW.user_id, (SELECT id FROM sessions WHERE user_id = NEW.user_id), 0); END`,
		).run();
		db.prepare(
			`CREATE TRIGGER IF NOT EXISTS notifications_to_update AFTER UPDATE ON notifications_to BEGIN UPDATE notifications_delivery SET delivered = 0 WHERE notification_id = NEW.notification_id AND user_id = NEW.user_id; END`,
		).run();
		db.prepare(
			`CREATE TRIGGER IF NOT EXISTS notifications_delivery_update AFTER UPDATE ON notifications_delivery BEGIN UPDATE sessions SET has_undelivered_notifications = (SELECT COUNT(*) FROM notifications_delivery WHERE session_id = NEW.session_id AND delivered = 0) WHERE id = NEW.session_id; END`,
		).run();
		db.prepare(
			`CREATE TRIGGER IF NOT EXISTS notifications_delivery_insert AFTER INSERT ON notifications_delivery BEGIN UPDATE sessions SET has_undelivered_notifications = (SELECT COUNT(*) FROM notifications_delivery WHERE session_id = NEW.session_id AND delivered = 0) WHERE id = NEW.session_id; END`,
		).run();
		db.prepare(
			`CREATE TRIGGER IF NOT EXISTS notifications_delivery_delete AFTER DELETE ON notifications_delivery BEGIN UPDATE sessions SET has_undelivered_notifications = (SELECT COUNT(*) FROM notifications_delivery WHERE session_id = OLD.session_id AND delivered = 0) WHERE id = OLD.session_id; END`,
		).run();

		db.prepare(`INSERT OR IGNORE INTO db_version (id, version) VALUES ('webui', 1)`).run();

		app.use(
			"/api/v1",
			(req, res, next) => {
				req.serverState = this.serverState;
				next();
			},
			api,
		);

		if (argv.prod) {
			app.use("/", express.static("../webUi/dist"));
			app.use((req, res) => {
				res.sendFile("../webUi/dist/index.html");
			});
		}

		fs.readFile("../package.json", "utf8")
			.then(data => {
				this.serverState.version = JSON.parse(data).version;
			})
			.catch(() => {
				this.serverState.version = undefined;
			});
		fs.readFile("../.git/HEAD", "utf8")
			.then(async data => {
				data = data.toString().trim();
				if (data.startsWith("ref: ")) {
					data = (await fs.readFile(`../.git/${data.substring(5)}`, "utf8")).toString().trim();
				}
				this.serverState.commit = data;
			})
			.catch(err => {
				this.serverState.commit = undefined;
			});

		super.mount();
	}

	async unmount() {
		app._router.stack = app._router.stack.filter(r => r.route && r.route.path !== "/api/v1");

		// TODO remove prod routes

		super.unmount();
	}

	async sendNotification(notification) {
		//
	}
}
