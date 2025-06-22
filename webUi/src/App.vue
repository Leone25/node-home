<script setup>
import { RouterLink, RouterView } from "vue-router";
import { useServer } from "@/stores/server.js";
import { mapState, mapActions } from "pinia";
</script>
<script>
export default {
	data() {
		return {};
	},
	computed: {
		...mapState(useServer, ["serverState"]),
	},
	methods: {
		...mapActions(useServer, ["getServerState", "verifySession"]),
	},
};
</script>
<template>
	<v-app>
		<v-main>
			<RouterView />
		</v-main>
	</v-app>
</template>

<style scoped></style>
