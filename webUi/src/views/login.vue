<script setup>
import { mapActions, mapState } from "pinia";
import { useServer } from "@/stores/server.js";
</script>
<script>
export default {
	data() {
		return {
			username: "",
			password: "",
			loading: false,
			error: null,
		};
	},
	computed: {
		...mapState(useServer, ["isAuthenticated", "serverState"]),
	},
	watch: {
		isAuthenticated: {
			handler() {
				if (this.isAuthenticated) {
					this.$router.push("/");
				}
			},
			immediate: true,
		},
		"serverState.hasUsers": {
			handler() {
				if (this.serverState && !this.serverState.hasUsers) {
					this.$router.push("/setup");
				}
			},
			immediate: true,
		},
	},
	methods: {
		...mapActions(useServer, ["login"]),
		async submitLogin() {
			try {
				this.loading = true;
				this.error = null;
				this.username = this.username.trim();
				this.password = this.password.trim();
				if (this.username === "") {
					this.loading = false;
					throw "Username is required";
				}
				if (this.password === "") {
					this.loading = false;
					throw "Password is required";
				}
				await this.login(this.username, this.password);
				this.loading = false;
			} catch (error) {
				this.loading = false;
				this.error = error;
			}
		},
	},
};
</script>
<template>
	<v-sheet class="bg-blue-grey-darken-4 pa-12 d-flex align-center h-100" rounded>
		<v-card class="mx-auto w-100 px-6 py-8" max-width="344">
			<v-form @submit.prevent="submitLogin">
				<div class="text-h4 d-flex align-center justify-center mb-4">
					<v-icon>mdi-account</v-icon>Sign In
				</div>

				<v-text-field
					v-model="username"
					:readonly="loading"
					class="mb-2"
					label="Username"
					clearable
				/>

				<v-text-field
					v-model="password"
					:readonly="loading"
					label="Password"
					placeholder="Enter your password"
					clearable
					type="password"
				/>

				<v-alert v-if="error" type="error">{{ error }}</v-alert>

				<br />

				<v-btn
					:loading="loading"
					color="success"
					size="large"
					type="submit"
					variant="elevated"
					block
				>
					Sign In
				</v-btn>
			</v-form>
		</v-card>
	</v-sheet>
</template>
