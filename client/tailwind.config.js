export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16140F', paper: '#F2EFE7', cream: '#FBF9F3',
        line: '#E2DECF', mute: '#8A8574', accent: '#FF4D00',
        moss: '#177B3F', amber: '#C4620A',
      },
      fontFamily: {
        disp: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};