<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { useServer } from './stores/server.js';
import { mapState, mapActions } from 'pinia';
</script>
<script>
export default {
	data() {
		return {
			isLoading: true,
		};
	},
	async mounted() {
		await this.getServerState();
		if (!this.serverState.hasUsers) {
			this.$router.push({ name: 'setup' });
		} else {
			await this.verifySession();
			this.isLoading = false;
		}
	},
	watch: {
		'$route': function() {
			this.isLoading = false;
		},
	},
	computed: {
		...mapState(useServer, ['serverState']),
	},
	methods: {
		...mapActions(useServer, ['getServerState', 'verifySession']),
	},
}
</script>
<template>
	<v-app>
		<v-main>
			<RouterView />
		</v-main>
	</v-app>
</template>

<style scoped></style>
