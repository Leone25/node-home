<script setup>
import { mapActions, mapState } from 'pinia';
import { useServer } from '@/stores/server.js';
</script>
<script>
export default {
	data() {
		return {
			tab: 0,
			firstUser: {
				username: '',
				password: '',
				confirmPassword: '',
			},
			loading: false,
			error: null,
		};
	},
	computed: {
		...mapState(useServer, ['isAuthenticated', 'serverState']),
	},
	watch: {
	},
	methods: {
		...mapActions(useServer, ['createUser', 'getServerState', 'login']),
		async handleModelChange(value) {
			try {
				if (value === 3) {
					this.loading = true;
					this.error = null;
					this.firstUser.username = this.firstUser.username.trim();
					this.firstUser.password = this.firstUser.password.trim();
					this.firstUser.confirmPassword = this.firstUser.confirmPassword.trim();
					if (this.firstUser.username === '') {
						this.loading = false;
						throw 'Username is required';
					}
					if (this.firstUser.password === '') {
						this.loading = false;
						throw 'Password is required';
					}
					if (this.firstUser.password !== this.firstUser.confirmPassword) {
						this.loading = false;
						throw 'Passwords do not match';
					}
					await this.createUser(this.firstUser.username, this.firstUser.password);
					await this.getServerState();
					await this.login(this.firstUser.username, this.firstUser.password);
					this.loading = false;
				}
				this.tab = value;
			} catch (error) {
				this.loading = false;
				this.error = error;
			}
		},
	}
}
</script>
<template>
	<v-sheet class="bg-blue-grey-darken-4 pa-12 d-flex align-center h-100" rounded>
		<v-stepper class="mx-auto w-100" max-width="800" :items="[{
				title: 'Welcome',
				subtitle: 'Welcome to the setup wizard',
				icon: 'mdi-account',
			}, {
				title: 'Create first user',
				subtitle: 'Create the first user',
				icon: 'mdi-account-plus',
			}, {
				title: 'Finish',
				subtitle: 'Finish the setup',
				icon: 'mdi-check',
			}]"
			:model-value="tab"
			@update:model-value="handleModelChange">
			<template #item.1>
				<v-card title="Welcome" flat>Welcome to your new Node-Home instance.</v-card>
			</template>

			<template #item.2>
				<v-card title="Create first user" flat>
					<v-text-field v-model="firstUser.username" label="Username" outlined ref="username" />
					<v-text-field v-model="firstUser.password" label="Password" outlined type="password" ref="password" />
					<v-text-field v-model="firstUser.confirmPassword" label="Confirm password" outlined type="password" ref="confirmPassword" />
					<v-alert v-if="error" type="error">{{ error }}</v-alert>
				</v-card>
			</template>

			<template #item.3>
				<v-card title="Done!" flat>You are now ready to start using your Node-Home instance.<br>Head into the settings to start adding devices.</v-card>
			</template>
			
			<template #actions="{next}">
				<div class="d-flex flex-row-reverse px-8 pb-5">
					<v-btn
						v-if="tab != 3"
						@click="next"
						color="primary"
						:loading="loading"
						ref="next"
					>Next</v-btn>
					<v-btn
						v-else
						color="primary"
						to="/settings"
						ref="next"
					>Finish</v-btn>
				</div>
			</template>
		</v-stepper>
	</v-sheet>
</template>