/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: "#f5f5f5",
                foreground: "#1a1a2e",
                primary: {
                    DEFAULT: "#0f3d2e",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#f0f0f0",
                    foreground: "#1a1a2e",
                },
                muted: {
                    DEFAULT: "#f5f5f5",
                    foreground: "#6b7280",
                },
                accent: {
                    DEFAULT: "#f59e0b",
                    foreground: "#1a1a2e",
                },
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#1a1a2e",
                },
                border: "#e5e7eb",
                input: "#e5e7eb",
                ring: "#0f3d2e",
                emerald: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    500: '#10b981',
                    600: '#059669',
                    800: '#065f46',
                },
                amber: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    400: '#fbbf24',
                    500: '#f59e0b',
                }
            },
        },
    },
    plugins: [],
}
