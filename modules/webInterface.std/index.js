const main = require('../../index');
const EventEmitter = main.CreateEventEmitter(exports);

let homes = {};
let scripts = [];

exports.registerHome = (home) => {
    homes[home.id] = home;
};

exports.addScript = (script) => {
    scripts.push(script);
};

exports.removeScript = (script) => {
    scripts.splice(scripts.indexOf(script), 1);
};

main.on('init', () => {

    main.express.get('/', (req, res) => {
        let temp = "<html><head><title>Home</title>";
        temp += scripts.reduce((acc, script) => {
            return acc + `<script src="${script}"></script>`;
        }, '');
        temp += "</head><body>";
        temp += homes[main.modules.databaseManager.databases.get('config').getData('/main/home').id].body;
        temp += "</body></html>";
        res.send(temp);
    });

    EventEmitter.emit('ready');
});