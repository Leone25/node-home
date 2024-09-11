import BaseExtension, { BaseDevice } from './BaseExtension.js';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from "node:crypto";

import { argv, app, core, db } from './index.js';

export default class WebUI extends BaseExtension {
    constructor() {
        super();
        
        // #region router setup
        this.router = Router({ mergeParams: true });
        
        this.router.use((req, res, next) => {
            if (!req.headers.authorization) {
                next();
                return;
            }
            
            let session = db.prepare('SELECT sessions.id AS device_id, * FROM sessions JOIN users ON sessions.user_id = users.id WHERE token = ?').get(req.headers.authorization);
            if (!session) {
                next();
                return;
            }

            if (session.expires < Date.now()) {
                db.prepare('DELETE FROM sessions WHERE token = ?').run(req.headers.authorization);
                next();
                return;
            }
            
            let roles = db.prepare('SELECT * FROM users_roles JOIN roles ON users_roles.role_id = roles.id WHERE user_id = ? AND active = 1').all(session.user_id);
            req.session = Session.fromDB(session, roles);

            console.log(req.session); // ! TEMP

			next();
        });
        
        this.loggedIn = Router({ mergeParams: true });
        
        this.loggedIn.use((req, res, next) => {
            if (!req.session) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            
            if (req.session.blocked) {
                res.status(423).json({ error: "User blocked" });
                return;
            }
            
            next();
        });
        
        this.admin = Router({ mergeParams: true });
        
        this.admin.use((req, res, next) => {
            if (req.session.isAdmin) {
                next();
            } else {
                res.status(403).json({ error: "Unauthorized" });
            }
        });
        // #endregion
		// #region server
		this.router.get('/ping', async (req, res) => {
			res.json({ success: true });
		});
		this.router.get('/server/state', async (req, res) => {
			let hasUsers = db.prepare('SELECT * FROM users LIMIT 1').get();
			res.json({
				version: "0.0.1",
				hasUsers: !!hasUsers,
			});
		});
		// #endregion
        // #region user
        this.loggedIn.get('/user/sessions/current', async (req, res) => {
			res.json(req.session);
		});
		
		this.loggedIn.get('/user/sessions', async (req, res) => {
            res.json(db.prepare('SELECT * FROM sessions WHERE user_id = ?').all(req.session.userId).map(s => {
				let session = Session.fromDB(s).toJSON();
				delete session.userId;
				delete session.name;
				delete session.blocked;
				delete session.roles;
				delete session.isAdmin;
				return session;
			}));
        });

        this.router.post('/user/sessions/new', async (req, res) => { // AKA login
            if (!req.body.username || !req.body.password) {
                res.status(400).json({ error: "Missing username or password" });
                return;
            }

            let user = db.prepare('SELECT * FROM users WHERE name = ?').get(req.body.username);
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
            let id = crypto.randomBytes(8).toString('hex'); // short id used for session identifier
            let token = crypto.randomBytes(22).toString('base64'); // token used for authentication
            let expires = Date.now() + 30000 * 60 * 60 * 24; // 30 day

            db.prepare('INSERT INTO sessions (id, user_id, token, expires, description) VALUES (?, ?, ?, ?, ?)').run(id, user.id, token, expires, req.body.description || req.headers['user-agent']);

            res.json({ id: id, token: token, user: user.name, expires: expires });
        });
        
        this.loggedIn.post('/user/sessions/refresh', async (req, res) => {
            let token = crypto.randomBytes(22).toString('base64');
            let expires = Date.now() + 30000 * 60 * 60 * 24; // 30 day
            
            db.prepare('UPDATE sessions SET token = ?, expires = ? WHERE id = ?').run(token, expires, req.session.deviceId);
            
            res.json({ id: req.session.deviceId, token: token, user: req.session.name, expires: expires });
        });
        
        this.loggedIn.delete('/user/sessions', async (req, res) => {
            db.prepare('DELETE FROM sessions WHERE id = ?').run(req.session.userId);
            res.json({ success: true });
        });

        this.loggedIn.delete('/user/sessions/:id', async (req, res) => {
            let session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }
            if (session.user_id !== req.session.userId) {
                res.status(403).json({ error: "Unauthorized" });
                return;
            }
            db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });
        // #endregion
        // #region users
        this.admin.get('/users', async (req, res) => {
            res.json(db.prepare('SELECT * FROM users').all());
        });
        
        this.router.post('/users/new', async (req, res) => { // AKA register
            let userExists = db.prepare('SELECT * FROM users LIMIT 1').get();
            if (userExists) {
                if (!req.session) {
                    res.status(401).json({ error: "Unauthorized" });
                    return;
                }
                if (!req.isAdmin) {
                    res.status(403).json({ error: "Unauthorized" });
                    return;
                }
            }
            
            if (!req.body.username || !req.body.password) {
                res.status(400).json({ error: "Missing username or password" });
                return;
            }
            
            let user = db.prepare('SELECT * FROM users WHERE name = ?').get(req.body.username);
            
            if (user) {
                res.status(409).json({ error: "User already exists" });
                return;
            }
            
            let id = crypto.randomBytes(8).toString('hex');
            let password = await bcrypt.hash(req.body.password, 10);
            
            db.prepare('INSERT INTO users (id, name, password) VALUES (?, ?, ?)').run(id, req.body.username, password);
            if (!userExists) {
                db.prepare('INSERT INTO users_roles (user_id, role_id, active) VALUES (?, \'admin\', 1)').run(id);
            } else if (req.body.roles) {
                for (let role of req.body.roles) {
                    db.prepare('INSERT INTO users_roles (user_id, role_id, active) VALUES (?, ?, 1)').run(id, role);
                }
            } 
            
            res.json({ success: true, user: { id: id, name: req.body.username } });
        });
        
        this.admin.get('/users/:id', async (req, res) => {
            res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
        });
        
        this.admin.post('/users/:id/block', async (req, res) => {
            db.prepare('UPDATE users SET blocked = 1 WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });
        
        this.admin.post('/users/:id/unblock', async (req, res) => {
            db.prepare('UPDATE users SET blocked = 0 WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });
        
        this.admin.get('/users/:id/roles', async (req, res) => {
            res.json(db.prepare('SELECT * FROM users_roles WHERE user_id = ?').all(req.params.id));
        });
        
        this.admin.patch('/users/:id/roles', async (req, res) => {
            if (!req.body.roles) {
                res.status(400).json({ error: "Missing roles" });
                return;
            }
            
            for (let role in req.body.roles) {
                if (req.body.roles[role] === true) {
                    db.prepare('INSERT OR IGNORE INTO users_roles (user_id, role_id, active) VALUES (?, ?, 1)').run(req.params.id, role);
                } else if (req.body.roles[role] === false) {
                    db.prepare('DELETE FROM users_roles WHERE user_id = ? AND role_id = ?').run(req.params.id, role);
                }
            }
            res.json({ success: true });
        });
        // #endregion
        // #region roles
        this.admin.get('/roles', async (req, res) => {
            res.json(db.prepare('SELECT roles.*, COUNT(users_roles.user_id) AS users FROM roles LEFT JOIN users_roles ON roles.id = users_roles.role_id GROUP BY roles.id').all());
        });
        
        this.admin.get('/roles/:id', async (req, res) => {
            let role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
            role.users = db.prepare('SELECT * FROM users_roles WHERE role_id = ?').all(req.params.id);
            res.json(role);
        });
        
        this.admin.patch('/roles/:id', async (req, res) => {
            if (!req.body.name && !req.body.canBeToggled) {
                res.status(400).json({ error: "Missing name or canBeToggled" });
                return;
            }
            
            db.prepare('UPDATE roles SET name = ?, can_be_toggled = ? WHERE id = ?').run(req.body.name, req.body.canBeToggled, req.params.id);
            res.json({ success: true });
        });
        
        this.admin.post('/roles/new', async (req, res) => {
            if (!req.body.name || !req.body.canBeToggled) {
                res.status(400).json({ error: "Missing name or canBeToggled" });
                return;
            }
            
            let id = req.body.id || req.body.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            db.prepare('INSERT INTO roles (id, name, can_be_toggled) VALUES (?, ?, ?)').run(id, req.body.name, req.body.canBeToggled);
            res.json({ success: true, role: { id: id, name: req.body.name, canBeToggled: req.body.canBeToggled } });
        });
        
        this.admin.delete('/roles/:id', async (req, res) => {
            db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });
        // #endregion
        // #region notifications
        this.router.get('/notifications/new', async (req, res) => { // this is an unsecure endpoint that only tells the client if there are new notifications, to retreive them the client must use /notifications with authorization
            let notifications = db.prepare('SELECT * FROM notifications_delivery JOIN notifications_to ON notifications_delivery.notification_id = notifications_to.notification_id WHERE session_id = ? AND delivered = 0 AND knows_read != read LIMIT 1').get(req.headers.deviceId || req.session.deviceId);
            if (!notifications) {
                res.json({ updates: false });
            } else {
                res.json({ updates: true });
            }
        }); // TODO: mirror this to a raw TCP endpoint for better efficiency when polling
        // #endregion
        // #region devices
        this.loggedIn.get('/devices', async (req, res) => {
            res.json(core.getDevices());
        });

        this.loggedIn.get('/devices/:id', async (req, res) => {
            res.json(core.getDevice(req.params.id));
        });

        this.loggedIn.post('/devices/:id/state', async (req, res) => {
            if (!req.body.state) {
                res.status(400).json({ error: "Missing state" });
                return;
            }

            res.json({ success: core.setDeviceState(req.params.id, req.body.state) });
        });

        this.admin.get('/devices/new', async (req, res) => {
            res.json(core.getDevicesToPair());
        });

        this.admin.post('/devices/new', async (req, res) => {
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
        });
        // #endregion

        this.router.use(this.loggedIn);
        this.loggedIn.use(this.admin);
    }

    async mount() {
        db.prepare(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, password TEXT, blocked INTEGER)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT, token TEXT, expires INTEGER, description TEXT, has_undelivered_notifications INTEGER, FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE, UNIQUE(token))`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT, can_be_toggled INTEGER)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS users_roles (user_id TEXT, role_id TEXT, active INTEGER, FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY(role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE)`).run();
        db.prepare(`INSERT OR IGNORE INTO roles (id, name, can_be_toggled) VALUES ('admin', 'Administrator', 0)`).run();
        db.prepare(`INSERT OR IGNORE INTO roles (id, name, can_be_toggled) VALUES ('user', 'User', 0)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, type TEXT, title TEXT, message TEXT, time INTEGER, extra TEXT, deleted INTEGER DEFAULT 0)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS notifications_to (notification_id TEXT, user_id TEXT, viewed INTEGER, FOREIGN KEY(notification_id) REFERENCES notifications(id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS notifications_delivery (notification_id TEXT, user_id TEXT, session_id TEXT, delivered INTEGER, FOREIGN KEY(notification_id, user_id) REFERENCES notifications_to(notification_id, user_id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY(session_id) REFERENCES sessions(id) ON UPDATE CASCADE ON DELETE CASCADE)`).run();
        db.prepare(`CREATE TRIGGER IF NOT EXISTS notifications_to_insert AFTER INSERT ON notifications_to BEGIN INSERT INTO notifications_delivery (notification_id, user_id, session_id, delivered) VALUES (NEW.notification_id, NEW.user_id, (SELECT id FROM sessions WHERE user_id = NEW.user_id), 0); END`).run();
        db.prepare(`CREATE TRIGGER IF NOT EXISTS notifications_to_update AFTER UPDATE ON notifications_to BEGIN UPDATE notifications_delivery SET delivered = 0 WHERE notification_id = NEW.notification_id AND user_id = NEW.user_id; END`).run();
        db.prepare(`CREATE TRIGGER IF NOT EXISTS notifications_delivery_update AFTER UPDATE ON notifications_delivery BEGIN UPDATE sessions SET has_undelivered_notifications = (SELECT COUNT(*) FROM notifications_delivery WHERE session_id = NEW.session_id AND delivered = 0) WHERE id = NEW.session_id; END`).run();
        db.prepare(`CREATE TRIGGER IF NOT EXISTS notifications_delivery_insert AFTER INSERT ON notifications_delivery BEGIN UPDATE sessions SET has_undelivered_notifications = (SELECT COUNT(*) FROM notifications_delivery WHERE session_id = NEW.session_id AND delivered = 0) WHERE id = NEW.session_id; END`).run();
        db.prepare(`CREATE TRIGGER IF NOT EXISTS notifications_delivery_delete AFTER DELETE ON notifications_delivery BEGIN UPDATE sessions SET has_undelivered_notifications = (SELECT COUNT(*) FROM notifications_delivery WHERE session_id = OLD.session_id AND delivered = 0) WHERE id = OLD.session_id; END`).run();
        
        db.prepare(`INSERT OR IGNORE INTO db_version (id, version) VALUES ('webui', 1)`).run();

        app.use('/api/v1', this.router);

        if (argv.prod) {
            app.use("/", express.static("../webUi/dist"));
            app.use((req, res) => {
                res.sendFile("../webUi/dist/index.html");
            });
        }

        super.mount();
    }

    async unmount() {
        app._router.stack = app._router.stack.filter(r => r.route && r.route.path !== '/api/v1');

        // TODO remove prod routes

        super.unmount();
    }
    
    async sendNotification(notification) {
        //
    }
}

class Session {
	constructor(userId, name, deviceId, token, expires, description, hasUndeliveredNotifications, password, blocked, roles) {
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
			data.blocked == 1
		];
		if (roles) {
			params.push(roles.map(r => {
				return {
					id: r.role_id,
					name: r.name,
					canBeToggled: r.can_be_toggled == 1,
					active: r.active == 1,
				}
			}));
		}
		return new Session(...params);
	}

	get isAdmin() {
		if (!this.roles) return false;
		let role = this.roles.find(r => r.id === 'admin');
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