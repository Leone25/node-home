import BaseExtension, { BaseDevice } from './BaseExtension.js';
import { Router } from 'express';

import { app, db } from './index.js';

export default class Extension extends BaseExtension {
    constructor() {
        super();
        this.canCreateDevice = true;

        this.devices = {};
        this.router = Router({ mergeParams: true });

        this.router.get('/devices', (req, res) => {
            res.json(Object.values(this.devices));
        });

        this.router.get('/devices/:id', (req, res) => {
            let device = this.devices[req.params.id];
            if (!device) {
                res.status(404).send('Not found');
                return;
            }
            res.json(device.state);
        });

        this.router.post('/devices/:id/click', (req, res) => {
            let device = this.devices[req.params.id];
            if (!device) {
                res.status(404).send('Not found');
                return;
            }
            device.click(req.body.path);
            res.send('OK');
        });

        this.router.post('/devices/:id/state', (req, res) => {
            let device = this.devices[req.params.id];
            if (!device) {
                res.status(404).send('Not found');
                return;
            }
            if (device.setState(req.body)) res.send('OK');
            else res.sendStatus(400);
        });

        this.router.ws('/devices/:id/state', (ws, req) => {
            let device = this.devices[req.params.id];
            if (!device) {
                ws.close();
                return;
            }
            device.registerWebSocket(ws);
        });
    }

    async mount() {
        db.prepare('CREATE TABLE IF NOT EXISTS httpDevices_schemas (id TEXT PRIMARY KEY, schema TEXT, FOREIGN KEY (id) REFERENCES devices(id) ON UPDATE CASCADE ON DELETE CASCADE)').run();
        db.prepare('CREATE TABLE IF NOT EXISTS httpDevices_states (id TEXT PRIMARY KEY, state TEXT, FOREIGN KEY (id) REFERENCES devices(id) ON UPDATE CASCADE ON DELETE CASCADE)').run();

        app.use('/httpDevice', this.router);
        super.mount();
    }

    async unmount() {
        app._router.stack = app._router.stack.filter(r => r.route && r.route.path !== '/httpDevice');
        super.unmount();
    }

    async findDevicesToPair() { // in case of http devices, this is a static list of preset devices
        return [
            {
                internalId: 'light', // not really used here, but other extensions can use this to identify the device
                name: 'Light',
                schema: {
                    light: {
                        type: 'switch',
                        name: 'Light',
                        color: '#f1c40f',
                        icon: 'lightbulb',
                    }
                }
            }
        ]
    }

    async pairDevice(deviceInfo) {
        db.prepare('INSERT INTO httpDevices_schemas (id, schema) VALUES (?, ?)').run(deviceInfo.id, JSON.stringify(deviceInfo.schema));
        db.prepare('INSERT INTO httpDevices_states (id, state) VALUES (?, ?)').run(deviceInfo.id, JSON.stringify({}));
    }

    async createDevice(deviceInfo) {
        deviceInfo.schema = JSON.parse(await db.prepare('SELECT schema FROM httpDevices_schemas WHERE id = ?').get(deviceInfo.id));
        let device = new HttpDevice(this, deviceInfo);
        this.devices[deviceInfo.id] = device;
        return device;
    }
}

class HttpDevice extends BaseDevice {
    constructor(extension, deviceInfo) {
        super();
        this.extension = extension;
        this.deviceInfo = deviceInfo;
        this._state = {};
        this._schema = deviceInfo.schema;
        this.ws = [];
        // TODO add SSE support

        //loading last state from the database
        let state = db.prepare('SELECT state FROM httpDevices_states WHERE id = ?').get(deviceInfo.id);
        if (state) {
            this.updateState(JSON.parse(state.state), true);
        }
    }

    get state() {
        return this._state;
    }

    get schema() {
        return this._schema;
    }

    get isOnline() {
        return this.ws.length > 0;
    }

    updateState(state, fromDevice=false) {
        let parsedState = super.validateStateUpdate(state, fromDevice);
        this._state = parsedState;
        this.emit('state', parsedState);
        this.ws.forEach(ws => ws.send(JSON.stringify(parsedState)));
        return true;
    }

    click(path) {
        this.emit('click', path);
        return true;
    }

    registerWebSocket(ws) {
        this.ws.push(ws);
        if (this.ws.length === 1) {
            this.emit('online');
        }
        ws.send(JSON.stringify(this.state));
        ws.on('close', () => {
            this.ws = this.ws.filter(w => w !== ws);
            if (this.ws.length === 0) {
                this.emit('offline');
            }
        });
    }

    toJSON() {
        return {
            id: this.deviceInfo.id,
            name: this.deviceInfo.name,
            schema: this.schema,
            state: this.state,
            isOnline: this.isOnline,
        };
    }
}