import { db } from "../index.js";

export const ping = {
	route: "/ping",
	async handler(req, res) {
		res.json({ success: true });
	},
};

export const serverState = {
	route: "/server/state",
	async handler(req, res) {
		let hasUsers = db.prepare("SELECT * FROM users LIMIT 1").get();
		res.json({
			...req.serverState,
			hasUsers: !!hasUsers,
		});
	},
};
