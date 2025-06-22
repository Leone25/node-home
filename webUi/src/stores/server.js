import { defineStore } from "pinia";

export const useServer = defineStore("server", {
	state: () => ({
		isSessionValid: null,
		serverState: null,
		session: null,
		authorization: null,
		sessionId: null,
	}),
	getters: {
		isAuthenticated() {
			return this.session !== null;
		},
	},
	actions: {
		makeRequest(method, path, body) {
			let abort = new AbortController();
			let headers = {};
			if (this.authorization) {
				headers.Authorization = this.authorization;
			}
			if (body) {
				headers["Content-Type"] = "application/json";
			}
			let response = fetch("/api/v1" + path, {
				method,
				headers,
				body: body ? JSON.stringify(body) : undefined,
				signal: abort.signal,
			}).then(async res => {
				if (!res.ok) {
					let content = res.headers.get("Content-Type");
					if (content && content.startsWith("application/json")) {
						let error = await res.json();
						throw new Error(error.error);
					}
					throw new Error(`Could not ${method} ${path} (${res.status} - ${res.statusText})`);
				}
				return res;
			});
			return [response, abort];
		},
		async getServerState() {
			let [request] = this.makeRequest("GET", "/server/state");
			request = await request;
			this.serverState = await request.json();
		},
		async verifySession() {
			this.authorization = localStorage.getItem("nodeHomeAuthorization");
			this.sessionId = localStorage.getItem("nodeHomeSessionId");
			if (this.authorization && this.sessionId) {
				try {
					let [request] = this.makeRequest("GET", "/user/sessions/current");
					request = await request;
					this.session = await request.json();
					this.isSessionValid = true;
					return true;
				} catch (e) {
					localStorage.removeItem("nodeHomeAuthorization");
					localStorage.removeItem("nodeHomeSessionId");
					this.authorization = null;
					this.sessionId = null;
					this.isSessionValid = false;
					return false;
				}
			}
			this.authorization = null;
			this.sessionId = null;
			this.isSessionValid = false;
			return false;
		},
		async login(username, password) {
			let [request] = this.makeRequest("POST", "/user/sessions", { username, password });
			request = await request;
			let session = await request.json();
			localStorage.setItem("nodeHomeAuthorization", session.token);
			localStorage.setItem("nodeHomeSessionId", session.id);
			this.session = session;
			this.authorization = session.token;
			this.sessionId = session.id;
		},
		async createUser(options) {
			let [request] = this.makeRequest("POST", "/users", options);
			request = await request;
			return await request.json();
		},
		async editUser(id, options) {
			let [request] = this.makeRequest("PATCH", `/users/${id}`, options);
			request = await request;
			return await request.json();
		},
		async deleteUser(id) {
			let [request] = this.makeRequest("DELETE", `/users/${id}`);
			request = await request;
			return await request.json();
		},
		async getUsers() {
			let [request] = this.makeRequest("GET", "/users");
			request = await request;
			return await request.json();
		},
		async getRoles() {
			let [request] = this.makeRequest("GET", "/roles");
			request = await request;
			return await request.json();
		},
		async getDevices() {
			let [request] = this.makeRequest("GET", "/devices");
			request = await request;
			return await request.json();
		},
		async getPairableDevices() {
			let [request] = this.makeRequest("GET", "/devices/discovery");
			request = await request;
			return await request.json();
		},
	},
});
