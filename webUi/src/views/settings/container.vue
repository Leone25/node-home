<script setup>
import { RouterView } from 'vue-router';
</script>

<template>
	<v-sheet class="bg-blue-grey-darken-4 pa-12 d-flex align-stretch h-100" rounded>
		<v-sheet class="mx-auto px-4 py-3" elevation="4" max-width="800" width="100%" rounded>
			<router-view v-slot="{ Component, route }">
				<v-scroll-x-reverse-transition mode="out-in">
					<v-sheet :key="route.params" class="position-relative h-100">
						<component :is="Component"/>
					</v-sheet>
				</v-scroll-x-reverse-transition>
			</router-view>
		</v-sheet>
	</v-sheet>
</template>
<style></style>