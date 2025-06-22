import schedule from "node-schedule";

export default class TaskManager {
	constructor(core) {
		this.core = core;
		this.tasks = {};
	}

	loadTasks() {
		this.core.db
			.prepare("SELECT * FROM tasks")
			.all()
			.forEach(task => {
				this.createTask(task);
			});
	}

	createTask(task) {
		this.core.db
			.prepare(
				"INSERT INTO OR IGNORE tasks (id, name, script_id, device_id, time) VALUES (?, ?, ?, ?, ?, ?)",
			)
			.run(task.id, task.name, task.script_id, task.device_id, task.time);
		this.tasks[task.id] = schedule.scheduleJob(task.time, () => {
			this.core.executeScript(this.core.getScript(task.script_id).code, {
				deviceId: task.device_id,
			});
		});
	}

	deleteTask(taskId) {
		this.tasks[taskId].cancel();
		delete this.tasks[taskId];
	}
}
