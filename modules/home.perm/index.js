const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

main.on('init', () => {
    //
    EventEmitter.emit('ready');
});