import { v4 as uuid } from "uuid";

import { EventEmitter } from './EventEmitter.js';

import { db } from './index.js';

import HttpDevice from './HttpDevice.js';

export class Core extends EventEmitter {
    constructor() {
        super();

        this.extensions = {
            http: new HttpDevice(),
        };

        this.devices = {};
    }

    init() {
        this.initDb();
        for (let extension in this.extensions) {
            if (this.extensions[extension].mount) this.extensions[extension].mount();
        }
        this.getDevicesList().forEach(device => {
            if (this.extensions[device.type]) {
                if (this.extensions[device.type].canCreateDevice) {
                    let d = this.extensions[device.type].createDevice({id: device.id, name: device.name});
                    d.onAny(this.handleDeviceEvent.bind(this, device.id));
                    this.devices[device.id] = d;
                } else {
                    console.error(`Extension ${device.type} can't create devices, the device ${device.name}(${device.id}) will not be loaded`);
                }
            } else {
                console.error(`Extension ${device.type} not found, the device ${device.name}(${device.id}) will not be loaded`);
            }
        });
    }

    initDb() {
        db.prepare(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS db_version (id TEXT PRIMARY KEY, version INTEGER)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, name TEXT, type TEXT)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS scripts (id TEXT PRIMARY KEY, name TEXT, code TEXT)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS devices_scripts (device_id TEXT, event TEXT, script_id TEXT, i INTEGER, PRIMARY KEY (device_id, script_id), FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE, FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE)`).run();
        db.prepare(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, name TEXT, script_id TEXT, device_id TEXT, time TEXT, state TEXT, FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE, FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE)`).run();
        
        
        db.prepare(`INSERT OR IGNORE INTO db_version (id, version) VALUES ('core', 1)`).run();
    }

    handleDeviceEvent(deviceId, event, ...args) {
        this.getDeviceScripts(deviceId)
            .filter(s => s.event == event)
            .forEach(s => {
                this.executeScript(s.code, {deviceId, event, args});
            });
    }

    executeScript(script, params = {}) {
        try {
            let f = new Function(script.code);
            f.apply({
                ...params,
                core: this,
            });
        } catch (e) {
            console.error(`Error in script: \n${script}\n\nError: ${e.message}\n\n`);
        }
    }


    // # public api
    getDevicesList() {
        return db.prepare('SELECT * FROM devices').all();
    }

    getDevices() {
        return this.devices;
    }

    getDevice(deviceId) {
        return this.devices[deviceId];
    }

    setDeviceState(deviceId, state) {
        let device = this.getDevice(deviceId);
        if (device) {
            return device.updateState(state);
        }
    }

    getDevicesToPair() {
        let result = {};

        for (let extension in this.extensions) {
            if (this.extensions[extension].canCreateDevice && this.extensions[extension].findDevicesToPair) {
                result[extension] = this.extensions[extension].findDevicesToPair();
            }
        }

        return result;
    }

    async pairDevice(extension, data = {}) {
        if (!this.extensions[extension] || !this.extensions[extension].canCreateDevice) throw new Error(`Extension ${extension} can't create devices`);

        data.id = data.id || uuid();
        data.id = data.id.replace(/[^a-zA-Z0-9]/g, ''); //sanitize id
        data.name = data.name || data.id;

        if (db.prepare('SELECT * FROM devices WHERE id = ?').get(data.id)) throw new Error(`Device with id ${data.id} already exists`);

        await this.extensions[extension].pairDevice(data); // pairing the device does not actually create it

        db.prepare('INSERT INTO devices (id, name, type) VALUES (?, ?, ?)').run(data.id, data.name, extension);

        let device = this.extensions[extension].createDevice(data);
        this.devices[data.id] = device;
        return device;
    }

    getScriptsList() {
        return db.prepare('SELECT * FROM scripts').all();
    }

    getDeviceScripts(deviceId) {
        return db.prepare('SELECT * FROM scripts LEFT JOIN devices_scripts ON scripts.id = devices_scripts.script_id WHERE devices_scripts.device_id = ? ORDER BY devices_scripts.i').all(deviceId);
    }

    getScript(scriptId) {
        return db.prepare('SELECT * FROM scripts WHERE id = ?').get(scriptId);
    }

    
}