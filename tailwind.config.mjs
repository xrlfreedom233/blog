import typography from '@tailwindcss/typography';
import { addDynamicIconSelectors } from '@iconify/tailwind';

// Tailwind v3 只有颜色值里包含 <alpha-value> 时才支持 /透明度 修饰符。
// 主题色都是 CSS 变量（var(--x)），直接用 bg-primary/5 会生成不出任何样式，
// 这里用 color-mix 包一层，让 bg-primary/5、text-text-muted/60 等正常生效。
const alphaVar = (name) =>
	`color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'selector',
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: alphaVar('primary'),
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
					100: alphaVar('base-100'),
					200: alphaVar('base-200'),
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
					base: alphaVar('text-base'),
					muted: alphaVar('text-muted'),
					disabled: 'var(--text-disabled)',
					placeholder: 'var(--text-placeholder)'
				},
				border: {
					base: alphaVar('border-base'),
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
