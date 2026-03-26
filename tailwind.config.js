/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: "#FAFAF8",
                foreground: "#1a1a2e",
                primary: {
                    DEFAULT: "#0f3d2e",
                    foreground: "#ffffff",
                    light: "#14533d",
                },
                secondary: {
                    DEFAULT: "#f0f0f0",
                    foreground: "#1a1a2e",
                },
                muted: {
                    DEFAULT: "#F5F4F2",
                    foreground: "#78716c",
                },
                accent: {
                    DEFAULT: "#f59e0b",
                    foreground: "#1a1a2e",
                    glow: "#FFD700",
                },
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#1a1a2e",
                },
                surface: {
                    DEFAULT: "#FFFFFF",
                    elevated: "#FEFEFE",
                },
                dark: {
                    bg: "#0A0A0C",
                    surface: "#141416",
                    elevated: "#1E1E22",
                    glass: "rgba(255, 255, 255, 0.05)",
                },
                neon: {
                    green: "#00F5A0",
                    blue: "#00D9FF",
                    gold: "#FFD700",
                    emerald: "#10E88C",
                },
                border: "#e8e5e0",
                input: "#e8e5e0",
                ring: "#0f3d2e",
                emerald: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    800: '#065f46',
                },
                teal: {
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                },
                amber: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                },
            },
            borderRadius: {
                '4xl': '2rem',
            },
            fontFamily: {
                outfit: ['Outfit_400Regular'],
                'outfit-semibold': ['Outfit_600SemiBold'],
                'outfit-bold': ['Outfit_700Bold'],
                'outfit-black': ['Outfit_900Black'],
            },
        },
    },
    plugins: [],
}
