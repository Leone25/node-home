import "vuetify/styles";
import { createVuetify } from "vuetify";
import "@mdi/font/css/materialdesignicons.css";
import { aliases, mdi } from "vuetify/iconsets/mdi";

export default createVuetify({
	theme: {
		defaultTheme: "dark",
	},
	icons: {
		defaultSet: "mdi",
		aliases,
		sets: {
			mdi,
		},
	},
});
