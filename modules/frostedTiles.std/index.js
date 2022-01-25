const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

const fs = require('fs').promises;

main.on('init', async () => {
    //
    
    main.modules.webInterface.registerHome({
        id: 'frostedTiles',
        name: 'Frosted Tiles',
        body: await fs.readFile(__dirname + '/index.html', 'utf8'),
    });
    
    EventEmitter.emit('ready');
});