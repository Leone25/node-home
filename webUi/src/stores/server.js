import { defineStore } from "pinia";

export const useServer = defineStore('server', {
	state: () => ({
		serverState: null,
		session: null,
	}),
	getters: {
		isAuthenticated() {
			return this.session !== null;
		}
	},
	actions: {
		async getServerState() {
			let request = await fetch('/api/v1/server');
			if (!request.ok) {
				throw new Error('Could not fetch server state');
			}
			this.serverState = await request.json();
		},
		async verifySession() {
			let authorization = localStorage.getItem('nodeHomeAuthorization');
			let sessionId = localStorage.getItem('nodeHomeSessionId');
			if (authorization && sessionId) {
				let request = await fetch('/api/v1/user/sessions/' + encodeURIComponent(sessionId), {headers: {Authorization: authorization}});
				if (request.ok) {
					this.session = await request.json();
					return true;
				}
				return false;
			}
		},
		async login(username, password) {
			let request = await fetch('/api/v1/user/sessions/new', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({username, password})
			});
			if (!request.ok) {
				throw new Error('Could not login');
			}
			let session = await request.json();
			localStorage.setItem('nodeHomeAuthorization', session.authorization);
			localStorage.setItem('nodeHomeSessionId', session.id);
			this.session = session;
		},
		async createUser(username, password) {
			let request = await fetch('/api/v1/users/new', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({username, password})
			});
			if (!request.ok) {
				if (request.headers.get('Content-Type') === 'application/json') {
					let error = await request.json();
					throw new Error(error.error);
				}
				throw new Error(`Could not create user (${request.status} - ${request.statusText})`);
			}
			return await request.json();
		}
	}
});