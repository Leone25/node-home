<script setup>
import { useServer } from "@/stores/server.js";
import { mapState, mapActions } from "pinia";
</script>
<script>
export default {
	data() {
		return {
			users: [],
			roles: [],
			search: "",
			editing: {
				username: "",
				password: "",
				blocked: false,
				roles: [],
			},
			loading: false,
			error: null,
			creatingDialog: false,
			editingDialog: false,
			deleteDialog: false,
		};
	},
	watch: {
		creatingDialog(val) {
			if (val) {
				this.editing = {
					username: "",
					password: "",
					blocked: false,
					roles: [],
				};
			}
			this.error = null;
		},
		editingDialog(val) {
			this.error = null;
		},
	},
	methods: {
		...mapActions(useServer, ["getUsers", "getRoles", "createUser", "editUser", "deleteUser"]),
		refreshUsers() {
			this.loading = true;
			this.getUsers().then(users => (this.users = users));
			this.loading = false;
		},
		handleCreateUser() {
			this.loading = true;
			this.error = null;
			this.createUser(this.editing)
				.then(() => {
					this.creatingDialog = false;
					this.refreshUsers();
				})
				.catch(err => {
					this.error = err;
					this.loading = false;
				});
		},
		edit(user) {
			this.editing = {
				id: user.id,
				username: user.username,
				password: "",
				blocked: user.blocked,
				roles: user.roles.map(role => role.id),
			};
			this.editingDialog = true;
		},
		handleEditUser() {
			this.loading = true;
			this.error = null;
			this.editUser(this.editing.id, this.editing)
				.then(() => {
					this.editingDialog = false;
					this.refreshUsers();
				})
				.catch(err => {
					this.error = err;
					this.loading = false;
				});
		},
		handleDeleteUser() {
			this.loading = true;
			this.error = null;
			this.deleteUser(this.editing.id)
				.then(() => {
					this.deleteDialog = false;
					this.refreshUsers();
				})
				.catch(err => {
					this.error = err;
					this.loading = false;
				});
		},
	},
	async mounted() {
		this.refreshUsers();
		this.getRoles().then(roles => (this.roles = roles));
	},
};
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
			{ title: 'Username', key: 'username' },
			{ title: 'Blocked', key: 'blocked', sortable: false },
			{ title: 'Roles', key: 'roles', sortable: false },
			{ title: 'Edit', key: 'edit', sortable: false, align: 'end' },
		]"
		:items="users"
		:search="search"
		:loading="loading"
		class="elevation-0"
	>
		<template #item.blocked="{ value: blocked }">
			<v-chip
				:color="blocked ? 'red' : 'green'"
				size="small"
				:text="blocked ? 'Blocked' : 'Active'"
			/>
		</template>
		<template #item.roles="{ value: roles }">
			<v-chip-group>
				<v-chip v-for="role in roles" :key="role.id" size="small" :text="role.name" />
			</v-chip-group>
		</template>
		<template #item.edit="{ item }">
			<v-btn size="x-small" variant="flat" icon="mdi-pencil" @click="edit(item)" />
		</template>
	</v-data-table-virtual>
	<v-dialog max-width="600" v-model="creatingDialog" :close-on-back="loading" :persistent="loading">
		<template #activator="{ props: activatorProps }">
			<v-btn
				v-bind="activatorProps"
				class="position-absolute bottom-0 right-0"
				color="primary"
				icon="mdi-plus"
			/>
		</template>

		<v-card :disabled="loading">
			<v-card-title>Add User</v-card-title>
			<v-card-text>
				<v-text-field label="Username" v-model="editing.username" />
				<v-text-field label="Password" v-model="editing.password" />
				<v-checkbox v-model="editing.blocked" label="Blocked" />
				<v-select
					v-model="editing.roles"
					:items="roles"
					item-title="name"
					item-value="id"
					label="Roles"
					chips
					multiple
				/>
				<v-alert v-if="error" type="error">{{ error }}</v-alert>
			</v-card-text>
			<v-card-actions>
				<v-btn color="error" @click="creatingDialog = false">Cancel</v-btn>
				<v-btn color="primary" @click="handleCreateUser" :loading="loading">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
	<v-dialog max-width="600" v-model="editingDialog" :close-on-back="loading" :persistent="loading">
		<v-card :disabled="loading">
			<v-card-title>Edit User</v-card-title>
			<v-card-text>
				<v-text-field label="Username" v-model="editing.username" />
				<v-text-field
					label="Password"
					hint="Leave empty to not change"
					:persistent-hint="true"
					v-model="editing.password"
				/>
				<v-checkbox v-model="editing.blocked" label="Blocked" />
				<v-select
					v-model="editing.roles"
					:items="roles"
					item-title="name"
					item-value="id"
					label="Roles"
					chips
					multiple
				/>
				<v-alert v-if="error" type="error">{{ error }}</v-alert>
			</v-card-text>
			<v-card-actions>
				<v-btn color="error" class="me-auto" @click="deleteDialog = true" :loading="loading"
					>Delete</v-btn
				>
				<v-btn color="error" @click="editingDialog = false">Cancel</v-btn>
				<v-btn color="primary" @click="handleEditUser" :loading="loading">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
	<v-dialog max-width="400" v-model="deleteDialog" :close-on-back="loading" :persistent="loading">
		<v-card :disabled="loading">
			<v-card-title>Delete User</v-card-title>
			<v-card-text>
				Are you sure you want to delete this user? This action cannot be undone.
				<v-alert v-if="error" type="error">{{ error }}</v-alert>
			</v-card-text>
			<v-card-actions>
				<v-btn color="error" @click="deleteDialog = false">Cancel</v-btn>
				<v-btn color="primary" @click="handleDeleteUser" :loading="loading">Delete</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
