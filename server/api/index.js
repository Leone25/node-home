import { Router } from "express";

import { db } from "../index.js";

import * as server from "./server.js";
import * as user from "./user.js";
import * as users from "./users.js";
import * as roles from "./roles.js";
import * as devices from "./devices.js";

const routes = {
	...server,
	...user,
	...users,
	...roles,
	...devices,
};

const router = Router({ mergeParams: true });

router.use((req, res, next) => {
	if (!req.headers.authorization) {
		next();
		return;
	}

	let session = db
		.prepare(
			"SELECT sessions.id AS device_id, * FROM sessions JOIN users ON sessions.user_id = users.id WHERE token = ?",
		)
		.get(req.headers.authorization);
	if (!session) {
		next();
		return;
	}

	if (session.expires < Date.now()) {
		db.prepare("DELETE FROM sessions WHERE token = ?").run(req.headers.authorization);
		next();
		return;
	}

	let roles = db
		.prepare(
			"SELECT * FROM users_roles JOIN roles ON users_roles.role_id = roles.id WHERE user_id = ? AND active = 1",
		)
		.all(session.user_id);
	req.session = Session.fromDB(session, roles);

	next();
});

for (const routeId in routes) {
	let route = routes[routeId];
	router[route.method?.toLowerCase() || "get"](
		route.route,
		(req, res, next) => {
			if (route.auth || route.admin) {
				if (!req.session) {
					res.status(401).json({ error: "Unauthorized" });
					return;
				}

				if (req.session.blocked) {
					res.status(423).json({ error: "User blocked" });
					return;
				}

				if (route.admin) {
					if (!req.session.isAdmin) {
						res.status(403).json({ error: "Unauthorized" });
						return;
					}
				}
			}
			next();
		},
		route.handler,
	);
}

export default router;

export class Session {
	constructor(
		userId,
		name,
		deviceId,
		token,
		expires,
		description,
		hasUndeliveredNotifications,
		password,
		blocked,
		roles,
	) {
		this.userId = userId;
		this.name = name;
		this.deviceId = deviceId;
		this.token = token;
		this.expires = expires;
		this.description = description;
		this.hasUndeliveredNotifications = hasUndeliveredNotifications;
		this.password = password;
		this.blocked = blocked;
		this.roles = roles;
	}

	static fromDB(data, roles) {
		let params = [
			data.user_id,
			data.name,
			data.device_id,
			data.token,
			data.expires,
			data.description,
			data.has_undelivered_notifications == 1,
			data.password,
			data.blocked == 1,
		];
		if (roles) {
			params.push(
				roles.map(r => {
					return {
						id: r.role_id,
						name: r.name,
						canBeToggled: r.can_be_toggled == 1,
						active: r.active == 1,
					};
				}),
			);
		}
		return new Session(...params);
	}

	get isAdmin() {
		if (!this.roles) return false;
		let role = this.roles.find(r => r.id === "admin");
		return role && role.active;
	}

	get expiresIn() {
		return this.expires - Date.now();
	}

	get expired() {
		return this.expires < Date.now();
	}

	toJSON() {
		let res = {
			userId: this.userId,
			name: this.name,
			deviceId: this.deviceId,
			expires: this.expires,
			description: this.description,
			hasUndeliveredNotifications: this.hasUndeliveredNotifications,
			blocked: this.blocked,
			isAdmin: this.isAdmin,
			expiresIn: this.expiresIn,
		};
		if (this.roles) {
			res.roles = this.roles;
		}
		return res;
	}
}
