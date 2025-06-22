import EventSource from "events";

export default class EventEmitter extends EventSource {
	constructor() {
		super();
		this.globalEventListeners = [];
	}

	onAny(listener) {
		this.globalEventListeners.push(listener);
	}

	offAny(listener) {
		this.globalEventListeners = this.globalEventListeners.filter(l => l !== listener);
	}

	emit(event, ...args) {
		super.emit(event, ...args);
		this.globalEventListeners.forEach(listener => listener(event, ...args));
	}
}
