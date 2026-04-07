# Multi-Touch Roulette 👆🎰

A fast-paced, multi-touch roulette party game built with React, Vite, and Framer Motion. Place your fingers on the screen, wait for the countdown, and let the roulette decide the winner (or loser)!

## ✨ Features
- **Multi-Touch Support**: Simultaneously tracks up to 10 touches dynamically.
- **Tension Building UI**: Utilizes Framer Motion for buttery-smooth pulsing, flashing out-glows, and elimination animations.
- **Procedural Audio**: 100% Web Audio API synthesized sound effects. No external audio files or assets required.
- **Victory Effects**: Built-in Confetti burst and colored winner text display.
- **Mobile Ready**: `touch-action: none` ensures browser swipe/zoom gestures do not interrupt gameplay.

## 🛠 Tech Stack
- React 18, Vite, TypeScript
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Canvas Confetti (Victory effects)

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open on your mobile device via local IP (e.g. `http://192.168.0.x:5173`) and test the multi-touch!

## 🔒 Security & Privacy
- **Client-Side Only**: This app requires no backend, database, or API keys. All state is strictly local.
- **Royalty-Free Assets**: All audio is mathematically synthesized using the standard Web Audio API.

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
