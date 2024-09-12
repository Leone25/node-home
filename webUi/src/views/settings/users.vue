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
		...mapActions(useServer, ['getUsers'])
	},
	async mounted() {
		this.users = await this.getUsers();
	}
}
</script>
<template>
	<div class="text-h1 d-flex align-center"><v-icon>mdi-account-edit</v-icon>Users</div>
	<v-data-table
		:headers="[
			{ text: 'Name', value: 'name' },
			{ text: 'Email', value: 'email' },
			{ text: 'Role', value: 'role' },
			{ text: 'Actions', value: 'actions', sortable: false }
		]"
		:items="users"
		:items-per-page="10"
		class="elevation-0"
	/>
</template>