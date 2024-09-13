<script setup>
import { useServer } from '@/stores/server.js';
import { mapState, mapActions } from 'pinia';
</script>
<script>
export default {
	data() {
		return {
			users: [],
			roles: [],
			search: '',
			editing: {
				name: '',
				password: '',
				roles: []
			}
		}
	},
	methods: {
		...mapActions(useServer, ['getUsers', 'getRoles']),
		rolesProps(role) {
			return {
				title: role.name,
				value: role.id
			}
		}
	},
	async mounted() {
		this.getUsers().then(users => this.users = users);
		this.getRoles().then(roles => this.roles = roles);
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
		<v-btn size="x-small" variant="flat" icon="mdi-pencil" />
	</template>
	</v-data-table-virtual>
	<v-dialog max-width="600">
		<template #activator="{ props: activatorProps }">
			<v-btn v-bind="activatorProps" class="position-absolute bottom-0 right-0" color="primary" icon="mdi-plus" />
		</template>

		<v-card>
			<v-card-title>Add User</v-card-title>
			<v-card-text>
				<v-text-field label="Name" v-model="editing.name" />
				<v-text-field label="Password" v-model="editing.password" />
				<v-select
					v-model="editing.roles"
					:items="roles"
					:items-props="rolesProps"
					label="Roles"
					chips
					multiple
				/>
			</v-card-text>
			<v-card-actions>
				<v-btn color="primary">Save</v-btn>
				<v-btn color="error">Cancel</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>