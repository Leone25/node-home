<script setup>
import { useServer } from "@/stores/server.js";
import { mapState, mapActions } from "pinia";
</script>
<script>
export default {
	data() {
		return {
			pairableDevices: [],
		};
	},
	methods: {
		...mapActions(useServer, ["getPairableDevices"]),
	},
	async mounted() {
		this.pairableDevices = await this.getPairableDevices();
	},
};
</script>
<template>
	<div class="text-h1 d-flex align-center"><v-icon>mdi-lamps</v-icon>Add Device</div>
	<div class="d-flex">
		<v-card class="pa-4" v-for="device in pairableDevices" :key="device.id">
			<v-card-title>{{ device.name }}</v-card-title>
			<v-card-subtitle>{{ device.brand }} {{ device.model }}</v-card-subtitle>
			<v-card-actions>
				<v-btn color="primary" @click="pairDevice(device.id)">Pair</v-btn>
			</v-card-actions>
		</v-card>
	</div>
</template>
