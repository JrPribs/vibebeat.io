# vibebeat.io

🎵 A browser-based groovebox (MPC-inspired) that gets anyone from zero to a solid 8-bar loop fast.

## Vision

vibebeat.io is a sophisticated music creation application that combines the power of modern web technologies with the intuitive workflow of classic grooveboxes. Create beats, melodies, and complete tracks directly in your browser with optional AI assistance.

## Key Features

- **Pads Mode**: 4×4 drum pads with step sequencer (1/16 grid, 2-8 bars)
- **Keys Mode**: Scale-locked piano with on-screen keys and recording
- **Sample Editor**: Upload, trim, slice, and map samples to pads
- **Sample Recording**: Record directly from microphone with bar-sync
- **AI Assists**: Beat and melody generation (login-gated)
- **Mixer**: Per-track volume/pan with master soft-clip guard
- **Arranger**: A/B patterns and song chaining
- **Export**: MP3, WAV, and project JSON formats

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API + AudioWorklet
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Export**: ffmpeg.wasm for MP3 conversion
- **Storage**: IndexedDB for local saves

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── core/           # Audio engine, timing, storage, AI, recording
├── features/       # Pads, keys, sample, record, mixer, arrange, export
├── shared/         # Models, UI components, utilities
public/
├── assets/
│   ├── kits/       # Factory CC0 drum kits
│   └── instruments/ # Factory CC0 instruments
└── favicon.svg
```

## Development Philosophy

- **Zero to beat in < 5 minutes**: Prioritize speed and ease of use
- **Progressive enhancement**: Works offline, better with login
- **Mobile-friendly**: Responsive design with touch support
- **Accessibility**: Keyboard control and screen reader support
- **Performance**: Low-latency audio with modern scheduling

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Credits

See [CREDITS.md](CREDITS.md) for attribution of audio content and third-party libraries.

---

**Made with 💜 for music creators everywhere**