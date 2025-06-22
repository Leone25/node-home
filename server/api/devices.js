import { db, core } from "../index.js";

export const devices = {
	auth: true,
	route: "/devices",
	async handler(req, res) {
		res.json(core.getDevices());
	},
};

export const devicesId = {
	auth: true,
	route: "/devices/:id",
	async handler(req, res) {
		res.json(core.getDevice(req.params.id));
	},
};

export const devicesIdStateEdit = {
	auth: true,
	method: "PUT",
	route: "/devices/:id/state",
	async handler(req, res) {
		if (!req.body.state) {
			res.status(400).json({ error: "Missing state" });
			return;
		}

		res.json({ success: core.setDeviceState(req.params.id, req.body.state) });
	},
};

export const devicesDiscovery = {
	admin: true,
	route: "/devices/discovery",
	async handler(req, res) {
		res.json(core.getDevicesToPair());
	},
};

export const devicesNew = {
	admin: true,
	method: "POST",
	route: "/devices",
	async handler(req, res) {
		if (!req.body.type) {
			res.status(400).json({ error: "Missing extension" });
			return;
		}

		try {
			let device = await core.pairDevice(req.body.type, req.body.data);
			res.json({ success: true, device: device });
		} catch (e) {
			res.status(400).json({ error: e.message });
		}
	},
};
