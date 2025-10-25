import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: Number(process.env.PORT) || 3000,
		strictPort: false, // Try next port if specified port is in use
		host: true
	}
});
