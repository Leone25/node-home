const config = require('./config');

const log = require('./src/logger');
const fs = require('fs');
const express = require('express');
const app = express();

// setting up interface
exports.express = app;
exports.log = log;
exports.CreateEventEmitter = (e) => {
    let EventEmitter = new (require('events'))();
    e.on = EventEmitter.on;
    e.off = EventEmitter.off;
    e._events = EventEmitter._events;
    e._eventsCount = EventEmitter._eventsCount;
    e._maxListeners = EventEmitter._maxListeners;
    return EventEmitter;
};
const EventEmitter = exports.CreateEventEmitter(exports);

// loading modules
exports.modules = {};

fs.readdirSync("./modules").forEach(module => {
    if (!module.endsWith('.ignore') && fs.lstatSync(`./modules/${module}`).isDirectory() && fs.lstatSync(`./modules/${module}/index.js`, {throwIfNoEntry: false})?.isFile()) {
        log("info", `Loading ${module.endsWith('.std') ? module.substring(0, module.length-4) : module} module`);
        exports.modules[module.endsWith('.std') ? module.substring(0, module.length-4) : module] = require(`./modules/${module}/index.js`);
    } else {
        log("issue", `Ignoring ${module.endsWith('.std') ? module.substring(0, module.length-4) : module} module`);
    }
});

log("info", "Initiating modules");

let loaded = 0;

Object.values(exports.modules).forEach((module) => {
    module.on('ready', (ready) => {
        loaded++;
        if (loaded === Object.keys(exports.modules).length) {
            log("info", "All modules loaded");
            EventEmitter.emit('ready');
            app.listen(config.port, () => {
                log('info', `Node-Home listening at http://localhost:${config.port}`)
            });
        }
    });
});

// Initiating modules
EventEmitter.emit('init');