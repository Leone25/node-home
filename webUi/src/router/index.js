import { createRouter, createWebHistory } from 'vue-router'
import home from '../views/home.vue'

import { useServer } from '@/stores/server';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: home
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('../views/login.vue')
		},
		{
			path: '/settings',
			name: 'settings',
			component: () => import('../views/settings/container.vue'),
			children: [
				{
					path: '',
					name: 'settings',
					component: () => import('../views/settings/root.vue'),
				},
				{
					path: 'users',
					name: 'settings-users',
					component: () => import('../views/settings/users.vue')
				},
				{
					path: 'information',
					name: 'settings-information',
					component: () => import('../views/settings/information.vue')
				}
			]
		},
		{
			path: '/setup',
			name: 'setup',
			component: () => import('../views/setup.vue')
		}
	]
});

/* await this.getServerState();
		if (!this.serverState.hasUsers) {
			this.$router.push('/setup');
		} else {
			if (await this.verifySession()) {
				this.isLoading = false;
			} else {
				this.$router.push('/login');
			}
		}*/

router.beforeEach(async (to, from) => {
	const server = useServer();

	if (server.isSessionValid === null) {
		await Promise.all([server.verifySession(), server.getServerState()]);
	}

	if (server.isAuthenticated) {
		if (to.name === 'login' || to.name === 'setup') {
			return '/';
		}
	} else {
		if (server.serverState.hasUsers) {
			if (to.name !== 'login') {
				return '/login';
			}
		} else {
			if (to.name !== 'setup') {
				return '/setup';
			}
		}
	}
	return true;
});

export default router
