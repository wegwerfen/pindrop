/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // or 'media' based on your preference
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      typography: (theme) => ({
        invert: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.blue.500'),
              '&:hover': {
                color: theme('colors.blue.400'),
              },
            },
            strong: { color: theme('colors.gray.300') },
            'ol > li::before': { color: theme('colors.gray.500') },
            'ul > li::before': { backgroundColor: theme('colors.gray.500') },
            blockquote: {
              color: theme('colors.gray.300'),
              borderLeftColor: theme('colors.gray.700'),
            },
            h1: { color: theme('colors.gray.100') },
            h2: { color: theme('colors.gray.100') },
            h3: { color: theme('colors.gray.100') },
            h4: { color: theme('colors.gray.100') },
            code: { color: theme('colors.gray.300') },
            'thead th': {
              color: theme('colors.gray.100'),
              borderBottomColor: theme('colors.gray.700'),
            },
            'tbody tr': {
              borderBottomColor: theme('colors.gray.700'),
            },
          },
        },
        dark: {
          css: {
            fontSize: '1.125rem', // 18px, adjust as needed
            lineHeight: '1.75rem', // 28px
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.blue.500'),
              '&:hover': {
                color: theme('colors.blue.400'),
              },
            },
            // Add more typography customizations as needed
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ],
}