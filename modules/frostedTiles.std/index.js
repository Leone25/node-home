const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

main.on('init', () => {
    //
    
    main.modules.webInterface.registerHome({
        id: 'frostedTiles',
        name: 'Frosted Tiles',
        body: 'test',
    });
    
    EventEmitter.emit('ready');
});