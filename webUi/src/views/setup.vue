<script setup>
import { mapActions } from 'pinia';
import { useServer } from '../stores/server.js';
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
		};
	},
	methods: {
		...mapActions(useServer, ['createUser']),
		async handleModelChange(value) {
			console.log(value)
			if (value === 3) {
				this.loading = true;
				if (this.firstUser.username.trim() === '') {
					this.loading = false;
					return false;
				}
				if (this.firstUser.password.trim() === '') {
					this.loading = false;
					return false;
				}
				if (this.firstUser.password !== this.firstUser.confirmPassword) {
					this.loading = false;
					return false;
				}
				//await this.createFirstUser();
				await new Promise((resolve) => setTimeout(resolve, 5000));
				this.loading = false;
			}
			this.tab = value;
		},
	}
}
</script>
<template>
	<v-container>
		<v-row>
			<v-col>
				<v-stepper :items="[{
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
							<v-text-field v-model="firstUser.username" label="Username" outlined></v-text-field>
							<v-text-field v-model="firstUser.password" label="Password" outlined type="password"></v-text-field>
							<v-text-field v-model="firstUser.confirmPassword" label="Confirm password" outlined type="password"></v-text-field>
						</v-card>
					</template>

					<template #item.3>
						<v-card title="Done!" flat>You are now ready to start using your Node-Home instance.<br>Head into the settings to start adding devices.</v-card>
					</template>
					
					<template #actions="{next}">
						<div class="d-flex flex-row-reverse px-8 pb-4">
							<v-btn
								v-if="tab != 3"
								@click="next"
								color="primary"
								:loading="loading"
							>Next</v-btn>
							<v-btn
								v-else
								color="primary"
								to="/settings"
							>Finish</v-btn>
						</div>
					</template>
				</v-stepper>
			</v-col>
		</v-row>
	</v-container>
</template>