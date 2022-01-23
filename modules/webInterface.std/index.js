const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

let homes = {};

exports.registerHome = (home) => {
    homes[home.id] = home;
};

main.on('init', () => {

    main.express.get('/', (req, res) => {
        res.send(homes[main.modules.databaseManager.databases.get('config').getData('/main/home').id].body);
    });

    EventEmitter.emit('ready');
});