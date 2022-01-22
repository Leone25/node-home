const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

class Device {
    constructor(options) {
        if (options.id) {
            this.id = options.id;
            let db = {};
            if (main.databaseManager.databases.get('devices').exists(`/${this.id}`))
                db = main.databaseManager.databases.get('devices').getData(`/${this.id}`);
        } else {
            while (true) {
                this.id = Math.floor(Math.random() * 1000000);
                if (!main.databaseManager.databases.get('devices').exists(`/${this.id}`))
                    break;
            }
        }
        this.name = db.name || options.name;
        this.type = db.type || options.type;
        this.module = db.module || options.module;
        this.scripts = db.scripts || [];
        
        if (!main.databaseManager.databases.get('devices').exists(`/${this.id}`))
            main.databaseManager.databases.get('devices').push(`/${this.id}`, this);

        this.data = {};
        main.CreateEventEmitter(this);
        this.pushDataUpdate = (data) => {
            // compare the data
            let change = {};
            for ([key, value] in Object.entries(data)) {
                if (this.data[key] !== value) {
                    change[key] = value;
                }
            }
            if (Object.keys(change).length > 0) {
                this.emit('dataUpdate', {change, data: this.data});
                main.log('message', `Device ${this.id} data update: ${JSON.stringify(change)}`);
                this.data = data;
            }
        };

        this.on('dataUpdate', (data) => {
            this.scripts.forEach(script => {
                // TODO run the script
            });
        });
    }
}

main.on('init', () => {
    exports.deviceList = [];
    exports.connect = (options) => {
        exports.deviceList.push(new Device(options));
    };
    EventEmitter.emit('ready');
});