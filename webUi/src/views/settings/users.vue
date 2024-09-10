<script setup>
import { useServer } from '@/stores/server.js';
import { mapState, mapActions } from 'pinia';
</script>
<script>
export default {
	data() {
		return {
			users: []
		}
	},
	methods: {
		...mapActions(useServer, ['getUsers']),
		async getUsers() {
			const response = await fetch('http://localhost:3000/users')
			this.users = await response.json()
		}
	},
	mounted() {
		this.users = this.getUsers();
	}
}
</script>
<template>
	<v-sheet class="bg-blue-grey-darken-4 pa-12 d-flex align-stretch h-100" rounded>
		<v-sheet class="mx-auto px-4 py-3" elevation="4" max-width="800" width="100%" rounded>
			<div class="text-h1 d-flex align-center"><v-icon>mdi-account-edit</v-icon>Users</div>
			<v-list>
				<v-list-item 
					v-for="user in users"
					:key="user.id"
					:title="user.username"
					:subtitle="user.role"
					prepend-icon="mdi-account"
				/>
			</v-list>
		</v-sheet>
	</v-sheet>
</template>