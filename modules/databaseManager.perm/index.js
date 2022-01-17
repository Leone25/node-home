const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

const fs = require('fs');
const JsonDB = require('node-json-db').JsonDB;

main.on('init', () => {
    //

    exports.databases = {};
    exports.databases.add = (database) => {
        exports.databases[database] = new JsonDB(`./databases/${database}`);
    };
    exports.databases.remove = (database) => {
        let path = exports.databases[database].config.filename;
        delete exports.databases[database];
        fs.unlink(path, (err) => {
            if (err) {
                main.log(error, `Failed to delete ${path}`);
            } else {
                main.log(info, `Deleted ${path}`);
            }
        });
    };

    // load all databases from ./databases
    fs.readdirSync('./databases').forEach(database => {
        if (fs.lstatSync(`./databases/${database}`, {throwIfNoEntry: false})?.isFile()) {
            main.log('info', `Loading ${database} database`);
            exports.databases.add(database);
        }
    });

    EventEmitter.emit('ready');
});