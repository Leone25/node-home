const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

main.on('init', () => {
    exports.deviceList = [];
    exports.deviceList.add = (device) => {
        exports.deviceList.push(device);
    };
    exports.deviceList.remove = (device) => {
        exports.deviceList.splice(exports.deviceList.indexOf(device), 1);
    };
    EventEmitter.emit('ready');
});