const chalk = require('chalk');

module.exports = (type, message) => {
    switch(type) {
        case "issue":
            type = chalk.magenta.bold("issue")
            break;
        case "message":
            type = chalk.cyan.bold("message");
            break;
        case "info":
            type = chalk.blue.bold("info");
            break;
        case "event":
            type = chalk.green.bold("event");
            break;
        case "error":
            type = chalk.red.bold("ERROR");
            break;
    }
    console.log(`${getTimestamp()} > [${type}] ${message}`);

    // TODO: Log to file
};

function getTimestamp() {
	var d = new Date();
	
	return "["+d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()+" - "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"."+d.getMilliseconds()+"]";
}