<script setup>
import { useServer } from '@/stores/server.js';
import { mapState } from 'pinia';
</script>
<script>
export default {
	data() {
		return {};
	},
	computed: {
		...mapState(useServer, ['serverState'])
	},
}
</script>
<template>
	<div class="text-h1 d-flex align-center"><v-icon>mdi-information</v-icon>Information</div>
	<div class="text-h2">Node-Home</div>
	<div class="text-subtitle">Version: <template v-if="serverState.version">{{ serverState.version }}</template><i v-else>unknown</i></div>
	<div class="text-subtitle">Commit: <template v-if="serverState.commit">{{ serverState.commit }}</template><i v-else>unknown</i></div>
</template>