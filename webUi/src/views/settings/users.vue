<script setup>

</script>
<script>
export default {
	data() {
		return {
			users: []
		}
	},
	methods: {
		async getUsers() {
			const response = await fetch('http://localhost:3000/users')
			this.users = await response.json()
		}
	},
}
</script>