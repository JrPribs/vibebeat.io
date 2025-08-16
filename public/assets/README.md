# vibebeat.io Public Assets

This directory contains all publicly accessible assets for the vibebeat.io application.

## Structure

### /kits/
Factory drum kits bundled with the application. All content is CC0 licensed.
- `factory-kit-01/` - Electronic drum kit
- `factory-kit-02/` - Acoustic drum kit

### /instruments/
Factory instrument samples for the Keys mode.
- Multisampled instruments in WAV format
- Optimized for web delivery

## Adding New Content

1. All audio content must be CC0 (public domain) licensed
2. Samples should be 44.1kHz/16-bit WAV format
3. Keep file sizes reasonable for web delivery
4. Update CREDITS.md with proper attribution
5. Include README.md in each kit/instrument folder

## File Naming Convention

### Drum Kits
- `kick.wav` - Kick drum
- `snare.wav` - Snare drum
- `hihat_closed.wav` - Closed hi-hat
- `hihat_open.wav` - Open hi-hat
- `clap.wav` - Hand clap
- `crash.wav` - Crash cymbal
- `ride.wav` - Ride cymbal
- `tom_high.wav` - High tom
- `tom_mid.wav` - Mid tom
- `tom_floor.wav` - Floor tom
- `perc_01.wav` - Percussion 1
- `perc_02.wav` - Percussion 2

### Instruments
- `{instrument_name}_{note}.wav` (e.g., `piano_c4.wav`)
- Use MIDI note names (C1, C#1, D1, etc.)