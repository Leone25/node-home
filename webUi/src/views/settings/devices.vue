<script setup>
import { useServer } from "@/stores/server.js";
import { mapState, mapActions } from "pinia";
</script>
<script>
export default {
	data() {
		return {
			devices: [],
			search: "",
			loading: false,
			error: null,
			editingDialog: false,
			deleteDialog: false,
		};
	},
	methods: {
		...mapActions(useServer, ["getDevices"]),
		refreshDevices() {
			this.loading = true;
			this.getDevices().then(devices => (this.devices = devices));
			this.loading = false;
		},
	},
	async mounted() {
		this.refreshDevices();
	},
};
</script>
<template>
	<div class="text-h1 d-flex align-center"><v-icon>mdi-lamps</v-icon>Devices</div>
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
			{ title: 'Brand', key: 'brand' },
			{ title: 'Model', key: 'model' },
			{ title: 'Status', key: 'isOnline' },
			{ title: 'Edit', key: 'edit', sortable: false, align: 'end' },
		]"
		:items="users"
		:search="search"
		:loading="loading"
		class="elevation-0"
	>
		<template #no-data>
			<v-sheet class="pa-4">
				<p class="mb-4">No devices found</p>
				<v-btn to="/settings/devices/new" color="primary" prepend-icon="mdi-plus"
					>Create Device</v-btn
				>
			</v-sheet>
		</template>
	</v-data-table-virtual>
</template>
