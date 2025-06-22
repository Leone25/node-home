import { db } from "../index.js";

export const roles = {
	admin: true,
	route: "/roles",
	async handler(req, res) {
		let result = db
			.prepare(
				"SELECT roles.*, COUNT(users_roles.user_id) AS users FROM roles LEFT JOIN users_roles ON roles.id = users_roles.role_id GROUP BY roles.id",
			)
			.all();
		res.json(
			result.map(r => {
				return {
					id: r.id,
					name: r.name,
					canBeToggled: r.can_be_toggled == 1,
					users: r.users,
				};
			}),
		);
	},
};

export const rolesId = {
	admin: true,
	route: "/roles/:id",
	async handler(req, res) {
		let role = db.prepare("SELECT * FROM roles WHERE id = ?").get(req.params.id);
		let result = {
			id: role.id,
			name: role.name,
			canBeToggled: role.can_be_toggled == 1,
		};
		result.users = db
			.prepare(
				"SELECT * FROM users_roles JOIN users ON users_roles.user_id = users.id WHERE role_id = ?",
			)
			.all(req.params.id);
		res.json(result);
	},
};

export const rolesEdit = {
	admin: true,
	method: "PATCH",
	route: "/roles/:id",
	async handler(req, res) {
		if (!req.body.name && !req.body.canBeToggled) {
			res.status(400).json({ error: "Missing name or canBeToggled" });
			return;
		}

		db.prepare("UPDATE roles SET name = ?, can_be_toggled = ? WHERE id = ?").run(
			req.body.name,
			req.body.canBeToggled,
			req.params.id,
		);
		res.json({ success: true });
	},
};

export const rolesNew = {
	admin: true,
	method: "POST",
	route: "/roles",
	async handler(req, res) {
		if (!req.body.name || !req.body.canBeToggled) {
			res.status(400).json({ error: "Missing name or canBeToggled" });
			return;
		}

		let id = req.body.id || req.body.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
		db.prepare("INSERT INTO roles (id, name, can_be_toggled) VALUES (?, ?, ?)").run(
			id,
			req.body.name,
			req.body.canBeToggled,
		);
		res.json({
			success: true,
			role: { id: id, name: req.body.name, canBeToggled: req.body.canBeToggled },
		});
	},
};

export const rolesDelete = {
	admin: true,
	method: "DELETE",
	route: "/roles/:id",
	async handler(req, res) {
		this.router.delete("", admin, async (req, res) => {
			db.prepare("DELETE FROM roles WHERE id = ?").run(req.params.id);
			res.json({ success: true });
		});
	},
};
