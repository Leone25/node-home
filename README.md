# Node-Home

An alternative to Home Assistant made with node.js.

# Features

[*] Simple HTTP based devices
[ ] Matter based devices
[ ] RTSP Cameras
[ ] Two-way audio
[ ] Modern web UI made with Vue.js
[ ] Native android application with fast notifications
[ ] Modular by design, so it's easy to implement more protocols

# Installation

```bash
git clone https://github.com/leone25/node-home.git
cd node-home
npm install
cp server/config.example.js server/config.js
npm run start
```

Navigate to `http://localhost:3000` to see the web interface. You will be prompted to create an first admin account. After that, you can start adding devices.

# Configuration

Edit the `server/config.js` file to edit the server configuration.

```javascript
export default {
	port: 3000,
	dbPath: "db.sqlite",
};
```

# Development

```bash
git clone https://github.com/leone25/node-home.git
cd node-home
npm install
cp server/config.example.json server/config.json
npm run dev
```

# Contributing

Feel free to open an issue to discuss a new feature or bug. Don't hesitate!
I also love to see people using my software, so feel free to open an issue to show me your setup!

# License

MIT
