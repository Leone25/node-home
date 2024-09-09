<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
	<v-app id="inspire">
		<v-navigation-drawer class="pt-4" color="grey-lighten-3" model-value rail disable-resize-watcher="true">
			<v-avatar v-for="n in 6" :key="n" :color="`grey-${n === 1 ? 'darken' : 'lighten'}-1`"
				:size="n === 1 ? 36 : 20" class="d-block text-center mx-auto mb-9"></v-avatar>
		</v-navigation-drawer>

		<v-bottom-navigation>
			<v-btn value="recent">
				<v-icon>mdi-history</v-icon>

				<span>Recent</span>
			</v-btn>

			<v-btn value="favorites">
				<v-icon>mdi-heart</v-icon>

				<span>Favorites</span>
			</v-btn>

			<v-btn value="nearby">
				<v-icon>mdi-map-marker</v-icon>

				<span>Nearby</span>
			</v-btn>
		</v-bottom-navigation>

		<v-main>
			lol
			<RouterView />
		</v-main>
	</v-app>
</template>

<style scoped></style>
