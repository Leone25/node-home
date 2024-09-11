import { createRouter, createWebHistory } from 'vue-router'
import home from '../views/home.vue'

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
			component: () => import('../views/settings/root.vue')
		},
		{
			path: '/settings/users',
			name: 'settings',
			component: () => import('../views/settings/users.vue')
		},
		{
			path: '/setup',
			name: 'setup',
			component: () => import('../views/setup.vue')
		}
	]
})

export default router
