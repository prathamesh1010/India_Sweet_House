import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'inter': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				'display': ['Inter Display', 'Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(var(--secondary-light))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					light: 'hsl(var(--accent-light))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Sweets Color Palette
				'sweet-red': 'hsl(var(--sweet-red))',
				'sweet-yellow': 'hsl(var(--sweet-yellow))',
				'sweet-green': 'hsl(var(--sweet-green))',
				'sweet-purple': 'hsl(var(--sweet-purple))',
				'sweet-orange': 'hsl(var(--sweet-orange))',
				'sweet-brown': 'hsl(var(--sweet-brown))',
				'sweet-cream': 'hsl(var(--sweet-cream))',
				// Natural Earth Tones
				'earth-green': 'hsl(var(--earth-green))',
				'earth-brown': 'hsl(var(--earth-brown))',
				'earth-beige': 'hsl(var(--earth-beige))',
				'earth-sage': 'hsl(var(--earth-sage))',
				'earth-terracotta': 'hsl(var(--earth-terracotta))',
				// Soft Pastels
				'pastel-lavender': 'hsl(var(--pastel-lavender))',
				'pastel-mint': 'hsl(var(--pastel-mint))',
				'pastel-peach': 'hsl(var(--pastel-peach))',
				'pastel-lemon': 'hsl(var(--pastel-lemon))',
				// Gold Accents
				gold: {
					DEFAULT: 'hsl(var(--gold))',
					light: 'hsl(var(--gold-light))',
					dark: 'hsl(var(--gold-dark))',
					glow: 'hsl(var(--gold-glow))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				hickory: {
					50: '#f7f3f0',
					100: '#ede4dd',
					200: '#d9c7b8',
					300: '#c2a68c',
					400: '#a8855f',
					500: '#8f6b47',
					600: '#7a5a3c',
					700: '#644a32',
					800: '#533d2a',
					900: '#351e10',
					950: '#1a0f08'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-background': 'var(--gradient-background)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-header': 'var(--gradient-header)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-sweets': 'var(--gradient-sweets)',
				'gradient-natural': 'var(--gradient-natural)',
				'gradient-gold': 'var(--gradient-gold)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'medium': 'var(--shadow-medium)',
				'strong': 'var(--shadow-strong)',
				'glow': 'var(--shadow-glow)',
				'gold': 'var(--shadow-gold)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'bounce': 'var(--transition-bounce)',
				'professional': 'var(--transition-professional)',
				'celebration': 'var(--transition-celebration)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fadeIn': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'slideIn': {
					from: { transform: 'translateX(-100%)' },
					to: { transform: 'translateX(0)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
					'50%': { boxShadow: '0 0 30px hsl(var(--primary) / 0.5)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fadeIn': 'fadeIn 0.6s ease-out',
				'slideIn': 'slideIn 0.5s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
