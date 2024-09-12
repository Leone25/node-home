<script setup>
import { useServer } from '@/stores/server.js';
import { mapState, mapActions } from 'pinia';
</script>
<script>
export default {
	data() {
		return {
			users: [],
			search: ''
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
	<v-text-field
        v-model="search"
        label="Search"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
    />
	<v-data-table-virtual
		:headers="[
			{ title: 'Name', key: 'name' },
			{ title: 'Roles', key: 'roles', sortable: false },
			{ title: 'Edit', key: 'edit', sortable: false, align: 'end' }
		]"
		:items="users"
		:search="search"
		class="elevation-0"
	>
	<template #item.roles="{ value: roles }">
		<v-chip-group>
			<v-chip v-for="role in roles" :key="role.id" size="small" :text="role.name"/>
		</v-chip-group>
	</template>
	<template #item.edit="{ item }">
		<v-btn size="x-small" variant="outline" icon="mdi-pencil" />
	</template>
	</v-data-table-virtual>
	<v-btn color="primary" icon="mdi-plus" text="New User" />
</template>