import { db } from "../index.js";

export const users = {
	admin: true,
	route: "/users",
	async handler(req, res) {
		let users = db.prepare("SELECT id, name, blocked FROM users").all();
		let assignedRoles = db.prepare("SELECT * FROM users_roles").all();
		let roles = db.prepare("SELECT * FROM roles").all();
		res.json(
			users.map(u => {
				let userRoles = assignedRoles
					.filter(r => r.user_id === u.id)
					.map(r => {
						let role = roles.find(role => role.id === r.role_id);
						return {
							id: role.id,
							name: role.name,
							canBeToggled: role.can_be_toggled == 1,
							active: r.active == 1,
						};
					});
				return {
					id: u.id,
					username: u.name,
					blocked: u.blocked == 1,
					roles: userRoles,
				};
			}),
		);
	},
};

export const usersNew = {
	method: "POST",
	route: "/users",
	async handler(req, res) {
		// AKA register
		let userExists = db.prepare("SELECT * FROM users LIMIT 1").get();
		if (userExists) {
			if (!req.session) {
				res.status(401).json({ error: "Unauthorized" });
				return;
			}
			if (!req.session.isAdmin) {
				res.status(403).json({ error: "Unauthorized" });
				return;
			}
		}

		if (!req.body.username || !req.body.password) {
			res.status(400).json({ error: "Missing username or password" });
			return;
		}

		let user = db.prepare("SELECT * FROM users WHERE name = ?").get(req.body.username);

		if (user) {
			res.status(409).json({ error: "User already exists" });
			return;
		}

		let id = crypto.randomBytes(8).toString("hex");
		let password = await bcrypt.hash(req.body.password, 10);
		let blocked = req.body.blocked ? 1 : 0;

		db.prepare("INSERT INTO users (id, name, password, blocked) VALUES (?, ?, ?, ?)").run(
			id,
			req.body.username,
			password,
			blocked,
		);
		if (!userExists) {
			db.prepare("INSERT INTO users_roles (user_id, role_id, active) VALUES (?, 'admin', 1)").run(
				id,
			);
		} else if (req.body.roles) {
			for (let role of req.body.roles) {
				db.prepare("INSERT INTO users_roles (user_id, role_id, active) VALUES (?, ?, 1)").run(
					id,
					role,
				);
			}
		}

		res.json({ success: true, user: { id: id, name: req.body.username } });
	},
};

export const usersId = {
	admin: true,
	route: "/users/:id",
	async handler(req, res) {
		let user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
		if (!user) return res.status(404).json({ error: "User not found" });
		let roles = db
			.prepare(
				"SELECT * FROM users_roles JOIN roles ON users_roles.role_id = roles.id WHERE user_id = ? AND active = 1",
			)
			.all(session.user_id);
		res.json({ ...user, roles });
	},
};

export const userEdit = {
	admin: true,
	method: "PATCH",
	route: "/users/:id",
	async handler(req, res) {
		if (
			(!req.body.username || req.body.username.length == 0) &&
			(!req.body.password || req.body.password.length == 0) &&
			req.body.blocked === undefined &&
			(!req.body.roles || req.body.roles.length === 0)
		) {
			res.status(400).json({ error: "Missing name, password, blocked or roles" });
			return;
		}

		let user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		if (req.body.username && req.body.username.length != 0 && req.body.username !== user.name) {
			db.prepare("UPDATE users SET name = ? WHERE id = ?").run(req.body.username, req.params.id);
		}
		if (req.body.password && req.body.password.length != 0) {
			let password = await bcrypt.hash(req.body.password, 10);
			db.prepare("UPDATE users SET password = ? WHERE id = ?").run(password, req.params.id);
		}
		if (req.body.blocked !== undefined) {
			db.prepare("UPDATE users SET blocked = ? WHERE id = ?").run(
				req.body.blocked ? 1 : 0,
				req.params.id,
			);
		}
		if (req.body.roles) {
			let currentRoles = db
				.prepare("SELECT * FROM users_roles WHERE user_id = ?")
				.all(req.params.id);
			for (let role of req.body.roles) {
				let currentRole = currentRoles.find(r => r.role_id === role);
				if (currentRole) {
					db.prepare("UPDATE users_roles SET active = 1 WHERE user_id = ? AND role_id = ?").run(
						req.params.id,
						role,
					);
				} else {
					db.prepare("INSERT INTO users_roles (user_id, role_id, active) VALUES (?, ?, 1)").run(
						req.params.id,
						role,
					);
				}
			}
			for (let role of currentRoles) {
				if (!req.body.roles.includes(role.role_id)) {
					db.prepare("UPDATE users_roles SET active = 0 WHERE user_id = ? AND role_id = ?").run(
						req.params.id,
						role.role_id,
					);
				}
			}
		}

		res.json({ success: true });
	},
};

export const usersDelete = {
	admin: true,
	method: "DELETE",
	route: "/users/:id",
	async handler(req, res) {
		db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
		res.json({ success: true });
	},
};
