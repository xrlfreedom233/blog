import typography from '@tailwindcss/typography';
import { addDynamicIconSelectors } from '@iconify/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'selector',
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: 'var(--primary)',
					hover: 'var(--primary-hover)',
					active: 'var(--primary-active)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					hover: 'var(--secondary-hover)',
					active: 'var(--secondary-active)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					hover: 'var(--accent-hover)',
					active: 'var(--accent-active)'
				},
				neutral: {
					DEFAULT: 'var(--neutral)',
					hover: 'var(--neutral-hover)',
					active: 'var(--neutral-active)'
				},
				base: {
					100: 'var(--base-100)',
					200: 'var(--base-200)',
					300: 'var(--base-300)',
					content: 'var(--base-content)'
				},
				info: {
					DEFAULT: 'var(--info)',
					content: 'var(--info-content)'
				},
				success: {
					DEFAULT: 'var(--success)',
					content: 'var(--success-content)'
				},
				warning: {
					DEFAULT: 'var(--warning)',
					content: 'var(--warning-content)'
				},
				error: {
					DEFAULT: 'var(--error)',
					content: 'var(--error-content)'
				},
				text: {
					base: 'var(--text-base)',
					muted: 'var(--text-muted)',
					disabled: 'var(--text-disabled)',
					placeholder: 'var(--text-placeholder)'
				},
				border: {
					base: 'var(--border-base)',
					light: 'var(--border-light)'
				},
				scrollbar: {
					track: 'var(--scrollbar-track)',
					thumb: 'var(--scrollbar-thumb)',
					'thumb-hover': 'var(--scrollbar-thumb-hover)'
				}
			},
			boxShadow: {
				sm: 'var(--shadow-sm)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)'
			}
		},
	},
	plugins: [typography, addDynamicIconSelectors()],
};
