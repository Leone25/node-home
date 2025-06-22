import { db } from "../index.js";
import { Session } from "./index.js";

export const userSessionsCurrent = {
	auth: true,
	route: "/user/sessions/current",
	async handler(req, res) {
		res.json(req.session);
	},
};

export const userSessions = {
	auth: true,
	route: "/user/sessions",
	async handler(req, res) {
		res.json(
			db
				.prepare("SELECT * FROM sessions WHERE user_id = ?")
				.all(req.session.userId)
				.map(s => {
					let session = Session.fromDB(s).toJSON();
					delete session.userId;
					delete session.name;
					delete session.blocked;
					delete session.roles;
					delete session.isAdmin;
					return session;
				}),
		);
	},
};

export const userSessionsNew = {
	method: "POST",
	route: "/user/sessions",
	async handler(req, res) {
		// AKA login
		if (!req.body.username || !req.body.password) {
			res.status(400).json({ error: "Missing username or password" });
			return;
		}

		let user = db.prepare("SELECT * FROM users WHERE name = ?").get(req.body.username);
		if (!user) {
			res.status(401).json({ error: "Invalid username" });
			return;
		}

		if (!(await bcrypt.compare(req.body.password, user.password))) {
			await new Promise(resolve => setTimeout(resolve, 1000)); // delay to prevent brute force
			res.status(401).json({ error: "Invalid password" });
			return;
		}

		// trandom string
		let id = crypto.randomBytes(8).toString("hex"); // short id used for session identifier
		let token = crypto.randomBytes(22).toString("base64"); // token used for authentication
		let expires = Date.now() + 30000 * 60 * 60 * 24; // 30 day

		db.prepare(
			"INSERT INTO sessions (id, user_id, token, expires, description) VALUES (?, ?, ?, ?, ?)",
		).run(id, user.id, token, expires, req.body.description || req.headers["user-agent"]);

		res.json({ id: id, token: token, user: user.name, expires: expires });
	},
};

export const userSessionsRefresh = {
	auth: true,
	route: "/user/sessions/refresh",
	async handler(req, res) {
		let token = crypto.randomBytes(22).toString("base64");
		let expires = Date.now() + 30000 * 60 * 60 * 24; // 30 day

		db.prepare("UPDATE sessions SET token = ?, expires = ? WHERE id = ?").run(
			token,
			expires,
			req.session.deviceId,
		);

		res.json({
			id: req.session.deviceId,
			token: token,
			user: req.session.name,
			expires: expires,
		});
	},
};

export const userSessionsDelete = {
	auth: true,
	method: "DELETE",
	route: "/user/sessions",
	async handler(req, res) {
		db.prepare("DELETE FROM sessions WHERE id = ?").run(req.session.userId);
		res.json({ success: true });
	},
};

export const userSessionsDeleteId = {
	auth: true,
	route: "/user/sessions/:id",
	async handler(req, res) {
		let session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(req.params.id);
		if (!session) {
			res.status(404).json({ error: "Session not found" });
			return;
		}
		if (session.user_id !== req.session.userId) {
			res.status(403).json({ error: "Unauthorized" });
			return;
		}
		db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
		res.json({ success: true });
	},
};
