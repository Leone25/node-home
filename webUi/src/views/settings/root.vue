<script setup>

</script>

<template>
	<div class="text-h1 d-flex align-center"><v-icon>mdi-cog</v-icon>Settings</div>
	<v-list>
		<v-list-subheader title="Personal" />
		<v-list-item 
			title="Profile"
			subtitle="Name, password, connected devices"
			prepend-icon="mdi-account"
			to="/settings/profile"
		/>
		<v-list-subheader title="System" />
		<v-list-item 
			title="Devices"
			subtitle="Connect, edit and remove devices"
			prepend-icon="mdi-wrench"
			to="/settings/devices"
		/>
		<v-list-item 
			title="Users"
			subtitle="Create, edit and remove users"
			prepend-icon="mdi-account-edit"
			to="/settings/users"
		/>
		<v-list-item 
			title="Roles"
			subtitle="Create, edit and remove roles"
			prepend-icon="mdi-account-group"
			to="/settings/roles"
		/>
		<v-list-item 
			title="Information"
			subtitle="System information"
			prepend-icon="mdi-information"
			to="/settings/information"
		/>
	</v-list>
</template>
<style></style>