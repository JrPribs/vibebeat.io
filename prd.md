# vibebeat.io — Final PRD & Agent Execution Playbook (v1.1)

**Date:** 2025‑08‑15
**Owner:** John Pribesh
**Mission:** A browser groovebox (MPC‑inspired) that gets **anyone** from zero → a solid **8‑bar loop** fast. Two tiny, targeted AI assists—**Beat** and **Melody**—are optional and fully editable.
**Non‑negotiable pushbacks (prioritized):**

1. **Cut scope, win demo.** No deep FX, no multi‑track mastering, no real‑time collab for hackathon.
2. **Nail zero‑to‑beat in minutes + two AI assists flawlessly.**

---

## 1) MVP Scope (must exist)

### 1.1 Core (user‑visible)

* **Pads (Drums):** 4×4 pads, step sequencer (1/16; 2–8 bars), per‑step velocity, swing, quantize.
* **Keys Mode:** scale lock (major/minor + a few modes), on‑screen keys, record/overdub, quantize.
* **Sample Editor (lite):** upload WAV/MP3, trim silence, transient slice → map slices to pads; pitch ±12; simple time‑stretch to tempo.
* **Sample Recording (mic):**

  * Request mic permission on user action.
  * Live input meter + optional monitor (headphones warning).
  * **Bar‑sync record** (start on next downbeat) with 1‑bar count‑in (toggle).
  * Record to internal buffer → auto‑trim silence → **optional quantize to bar** → save as clip.
  * **Assign recorded clip**: (a) to a **Pad** (one‑shot or slice‑mapped), or (b) to **Keys** (multi‑sample mapping across keys if sliced).
  * Immediate playback aligned to project tempo.
* **Mixer (lite):** per‑track volume/pan; master soft‑clip guard; (optional) light send reverb/delay.
* **Arranger (mini):** A/B patterns; chain into short song.
* **Export:** **MP3** (default) + **WAV 44.1k/16**; **Project JSON**.
* **Preinstalled CC0 kits/sounds** (≥ 2 drum kits + 1 simple keys instrument).
* **Auth gating:** Anonymous = local saves + export; **Login** = **cloud save + AI + share link**.
* **AI Assists:**

  * **Beat Assist**: generate on‑grid drum pattern (8/16/32 bars), style, density, swing, humanize.
  * **Melody Assist**: generate melody in key/scale (8/16/32 bars), density, contour, humanize.
* **Onboarding & UX:** 3‑card “how it works”, hotkeys, empty states, “Re‑roll” & “Keep previous” buttons.

### 1.2 Non‑functional

* **Latency:** AudioWorklet scheduling; Low vs Stable mode; visible latency readout.
* **Reliability:** Autosave every 10s; recover last session.
* **A11y:** Keyboard control for pads; focus outlines; readable labels.
* **Licensing:** Bundle **CC0/public‑domain** only; link to others (no redistribution).
* **Privacy:** User uploads/recordings private by default; shared links unlisted.

### 1.3 Success criteria

* **Time‑to‑first loop < 5 min** (median).
* ≥ **50%** sessions use an AI assist.
* ≥ **30%** sessions export MP3/WAV or share.

---

## 2) Data & Contracts

### 2.1 Project JSON (persisted & shareable)

```json
{
  "version": "1.1.0",
  "projectId": "uuid",
  "title": "New Project",
  "tempoBpm": 120,
  "timeSig": "4/4",
  "bars": 8,
  "swingPercent": 0,
  "tracks": [
    {
      "id": "t1",
      "type": "DRUM",
      "name": "Drums",
      "kitId": "factory-kit-01",
      "pattern": {
        "grid": "1/16",
        "steps": 128,
        "pads": [
          {"pad": "KICK", "hits": [{"step": 0, "vel": 118}]}
        ]
      },
      "mixer": {"vol": 0.8, "pan": 0.0, "sendA": 0.1, "sendB": 0.0}
    },
    {
      "id": "t2",
      "type": "KEYS",
      "name": "Keys",
      "key": "A",
      "scale": "natural_minor",
      "notes": [
        {"step": 0, "pitch": "A3", "durSteps": 2, "vel": 96}
      ],
      "mixer": {"vol": 0.8, "pan": -0.1, "sendA": 0.12, "sendB": 0.0}
    },
    {
      "id": "t3",
      "type": "AUDIO",
      "name": "Sample",
      "clip": {
        "src": "blob://or-supabase-url",
        "origin": "mic|upload|factory",
        "originalSampleRate": 48000,
        "startSec": 0.0,
        "endSec": 3.2,
        "barSync": true,
        "detectedBpm": 92,
        "detectedKey": "C",
        "slices": [{"ms": 0}, {"ms": 400}, {"ms": 800}]
      },
      "mixer": {"vol": 0.9, "pan": 0.0, "sendA": 0.05, "sendB": 0.0}
    }
  ],
  "arrangement": ["A","A","B","B"],
  "createdAt": 0,
  "updatedAt": 0,
  "ownerUid": null
}
```

### 2.2 AI Tool Schemas (strict JSON)

**Drum Pattern tool** — `write_drum_pattern`
*Input* (same as v1.0).
*Output* (same as v1.0, with `"steps"` = bars × 16 for 1/16 grid).

**Melody tool** — `write_melody`
*Input/Output* (same as v1.0).

**Validation (shared)**

* Steps in `[0, steps-1]`; grid ∈ {1/8, 1/12, 1/16, 1/24, 1/32, 1/16T}.
* No overlapping notes on same voice unless `"tie": true`.
* Non‑JSON ⇒ auto‑repair prompt; fail gracefully after one retry.

---

## 3) Content & Licensing

* **Bundle (redistributable):** CC0 subsets: ≥2 drum kits + 1 keys/lead instrument multisample.
* **Later via link/API:** External packs (royalty‑free, no redistribution).
* **Credits & license page:** Clear CC0 statement.

---

## 4) Platform & Services

* **UI/Styling:** Tailwind CSS.
* **Auth/DB/Storage/Edge:** **Supabase**

  * Auth: Social sign‑in.
  * Postgres: tables for `projects`, `assets`, `shares`, `ai_logs`.
  * Storage: user assets (audio, project exports).
  * Edge Functions: share‑link creation, AI rate‑limits, signed URLs.
* **Audio:** Web Audio API + AudioWorklet.
* **Export:** WAV writer + **ffmpeg.wasm** WAV→MP3.

---

## 5) UI/UX Contract (MVP)

* **Top bar:** Tempo, Play/Stop, Metronome, Latency Mode, Export, Login.
* **Left nav:** Pads / Keys / Sample / **Record** / Mixer / Arrange.
* **Record view (new):**

  * Permission request button; live input meter; input gain; Monitor toggle (warn about feedback).
  * Count‑in (1 bar) toggle; **Record on next downbeat** toggle.
  * Stop → preview clip → **Trim silence** (auto) → **Quantize to bar** (optional) → **Save**.
  * **Assign**: “Send to Pad” (choose pad) or “Send to Keys” (auto‑map slices across keys).
* **Pads view:** 4×4 pads, step grid, velocity lane, Swing %, Quantize, **Generate Beat** (8/16/32), Re‑roll, Humanize, Keep previous as Track B.
* **Keys view:** Piano (Z/X octave), Scale lock, Record/Overdub, Quantize, **Generate Melody** (8/16/32), Re‑roll.
* **Sample view:** Waveform, Trim, Auto‑slice (3 suggestions), Map to pads, Pitch, Stretch.
* **Export modal:** MP3 (default 192 kbps) + WAV 44.1k/16 + Project JSON.
* **Onboarding:** 3 cards + “Try a demo project”.

---

# 6) Agent Execution Plan — Step‑by‑Step Tasks

> **Discipline:** Each task is atomic and testable. Implement → verify acceptance → commit → proceed. If a check fails, **repair** before advancing. Keep scope tight.

### Phase 0 — Repo & Guardrails

0.1 **Create repository**

* Initialize repo `vibebeat`. Add `.editorconfig`, `.gitignore`, `README.md`.

0.2 **Tooling**

* Prettier + ESLint + Husky pre‑commit (format+lint).
* Strict TS config. CI workflow: `install → build → test`.

0.3 **Scaffold app shell**

* Minimal app: Top bar, Left nav, Main area with route/view switching.
* Tailwind configured.
* **Acceptance:** Dev server runs; UI shell visible.

0.4 **Folders**

```
/src/core/            (audio-engine, timing, storage, ai, recording)
/src/features/        (pads, keys, sample, record, mixer, arrange, export)
/src/shared/          (models, ui components, utils)
/public/assets/kits/  (factory CC0 kits)
/public/assets/instruments/
/public/favicon.svg
```

* **Acceptance:** All paths resolve.

0.5 **Dependencies**

* Install: `uuid`, `zod`, `idb-keyval`, `@ffmpeg/ffmpeg`, `@supabase/supabase-js`.
* Add `LICENSE.md`, `CREDITS.md` placeholders.

---

### Phase 1 — Models & Schemas

1.1 **TypeScript models**

* `Project`, `Track` (`DRUM|KEYS|AUDIO`), `Pattern`, `Note`, `StepHit`, `Mixer`, `Clip` (with `origin`, `originalSampleRate`, `barSync`), `ExportOptions`.
* **Acceptance:** Types compile; sample `Project` constant passes.

1.2 **Zod schemas (AI)**

* DrumPatternInput/Output, MelodyInput/Output.
* **Acceptance:** Invalid JSON rejected; valid mock passes.

1.3 **State store**

* Simple reactive store for `project`, `transport`, `selection`.
* **Acceptance:** Can change tempo/bars; unit tests pass.

---

### Phase 2 — Audio Engine (playback)

2.1 **Audio service**

* Init/resume/suspend `AudioContext`; expose `outputLatency`.
* **Acceptance:** Latency readout shown in top bar.

2.2 **Sample cache**

* Loader with concurrency cap; prefetch factory kits.
* **Acceptance:** Buffers loaded at start; no 404s.

2.3 **Worklet scheduler**

* Worklet processor mailbox + host **Scheduler** (lookahead, metronome).
* **Acceptance:** Metronome stable for 60s; no drift.

2.4 **Pad & grid playback**

* Pad hit with velocity → gain; step grid (1/16; 2–8 bars) with swing.
* **Acceptance:** Hardcoded pattern loops correctly; swing audible.

2.5 **Mixer (lite)**

* Track `GainNode` + `StereoPannerNode`; master soft‑clip guard.
* **Acceptance:** Controls affect audio; no clipping on export preview.

2.6 **Latency modes**

* Low vs Stable; scheduling params update live.
* **Acceptance:** Toggle works during playback.

---

### Phase 3 — UI: Pads & Keys

3.1 **Pads view**

* 4×4 pads; keyboard mappings; velocity via press duration or modifier; mute/solo.
* **Acceptance:** Clicking/keys triggers; velocity audible.

3.2 **Step sequencer**

* 1/16 grid, per‑step velocity lane; bar selector (2–8).
* **Acceptance:** Edits reflect in playback.

3.3 **Swing & quantize**

* Swing 0–60%; Quantize 100/75/50/25.
* **Acceptance:** Recording quantizes; toggle works.

3.4 **Keys view**

* Piano UI; scale lock; Z/X octave; record/overdub to loop.
* **Acceptance:** Notes recorded and played back; out‑of‑key blocked.

---

### Phase 4 — **Sample Recording (mic) — NEW MUST‑HAVE**

4.1 **Permission & setup**

* “Enable Microphone” button (user gesture).
* Request `getUserMedia({audio:true})`; create `MediaStreamAudioSourceNode`.
* **Acceptance:** Permission prompt appears; handle deny with friendly message.

4.2 **Monitor & input gain**

* Input meter (RMS/peak); input gain slider; **Monitor** toggle (off by default; show **feedback warning**).
* **Acceptance:** Meter moves; monitor routes to master when enabled.

4.3 **Record controls**

* Count‑in toggle (1 bar).
* **Record on next downbeat** toggle (bar‑sync).
* **Start/Stop** buttons; show elapsed bars/beats.
* **Acceptance:** Start aligns to next bar when enabled; count‑in plays.

4.4 **Capture pipeline**

* Record into ring buffer via Worklet or `MediaRecorder`; ensure **sample rate normalization** to project rate on stop.
* **Acceptance:** After stop, a waveform preview appears.

4.5 **Post‑record actions**

* **Auto‑trim silence** (threshold).
* **Quantize to bar** (optional): snap start/end to nearest bar edges.
* **Detect BPM/Key** (light heuristic OK for demo).
* **Save clip** to project.
* **Acceptance:** Saved clip stored in `tracks[type=AUDIO].clip`.

4.6 **Assign**

* **Send to Pad**: choose pad → one‑shot or slice‑mapped (transient detect).
* **Send to Keys**: auto split into slices and map across keys (low→high).
* **Acceptance:** Assigned pad/keys trigger recorded audio in sync.

4.7 **Storage**

* Anonymous: keep clip as `blob://` and include in local save.
* Logged‑in: upload to **Supabase Storage**; store URL in project; signed URL when needed.
* **Acceptance:** Reopen project restores recording.

4.8 **Mobile/iOS caveats**

* Audio context must start on user gesture; show helper text.
* Recommend headphones for monitoring.
* **Acceptance:** iOS test: record → assign → play works.

---

### Phase 5 — Sample Editor (uploads)

5.1 **Waveform & upload**

* Drag‑drop; decode; render waveform.
* **Acceptance:** WAV/MP3 show waveform.

5.2 **Trim & auto‑trim**

* Start/end handles; Trim Silence button.
* **Acceptance:** Clip shortens; preview.

5.3 **Transient slice**

* Energy threshold detect; show 3 slice sets; apply to pads.
* **Acceptance:** Pads trigger slices.

5.4 **Pitch & stretch**

* Pitch ±12 (resample); tempo‑match stretch (naive granular).
* **Acceptance:** Loop aligns to tempo “good enough” for demo.

---

### Phase 6 — Preinstalled Content

6.1 **Factory kits**

* Place CC0 one‑shots in `/public/assets/kits/factory-kit-01` & `02`.
* Seeder: `loadFactoryKits()` on app start.
* **Acceptance:** Kit switcher swaps sounds.

6.2 **Factory instrument**

* Simple keys/lead multisample (few notes stretched).
* **Acceptance:** Keys view uses factory instrument.

6.3 **Credits & license page**

* `/about` linking to `CREDITS.md` and `LICENSE.md`.
* **Acceptance:** Page loads, lists sources.

---

### Phase 7 — Export & Storage

7.1 **WAV export**

* Offline render loop/arrangement; write WAV 44.1k/16.
* **Acceptance:** Re‑imported WAV aligns exactly.

7.2 **MP3 export**

* **ffmpeg.wasm**: WAV → MP3 192 kbps (default).
* **Acceptance:** MP3 length matches; plays.

7.3 **Project JSON**

* Export `.vibe.json`; import/replace current.
* **Acceptance:** Round‑trip yields identical state.

7.4 **Local saves (anonymous)**

* `idb-keyval` autosave every 10s; Recent Projects list.
* **Acceptance:** Reload restores session.

7.5 **Supabase: auth & cloud**

* Initialize Supabase client.
* **Tables**:

  * `projects(id uuid pk, owner uuid, title text, json jsonb, created_at, updated_at)`
  * `assets(id uuid pk, owner uuid, kind text, path text, created_at)`
  * `shares(id uuid pk, project uuid, created_at)`
  * `ai_logs(id uuid pk, owner uuid, tool text, meta jsonb, created_at)`
* **RLS**: owner‑only for `projects`/`assets`; public read for `shares`.
* Storage buckets: `user-assets`.
* **Acceptance:** After login: Save to cloud stores JSON+assets; signed URLs load.

7.6 **Share link**

* Create share row; link `/share/:id` renders read‑only with “Make a Copy.”
* **Acceptance:** Open link on another device; copy creates user‑owned clone.

---

### Phase 8 — AI Assists (login‑gated)

8.1 **AI provider**

* Pluggable interface: `generateDrumPattern(input)`, `generateMelody(input)`; mock provider first.
* **Acceptance:** Mock returns Zod‑valid JSON.

8.2 **Prompt templates (few‑shot)**

* Keep short; include `tempo`, `grid`, `bars`, `style`, `key/scale` (melody), `kit_map`.
* **Acceptance:** Sample requests produce plausible patterns.

8.3 **UI integration**

* Pads/Keys buttons: Generate (8/16/32), Density, Humanize/Contour, Re‑roll, Keep previous as Track B.
* **Acceptance:** Apply + edit works.

8.4 **Auto‑repair**

* Invalid JSON → repair prompt (once) → else toast error.
* **Acceptance:** 20/20 test generations valid or gracefully error.

8.5 **Rate‑limit & quotas**

* 1 request/2s; 5/min; bars ≤ 32.
* **Acceptance:** Exceed limits shows friendly message.

8.6 **Telemetry (storytelling)**

* Log `{tool, style, bars, beforeHash, afterHash}` to `ai_logs`.
* **Acceptance:** Entries visible in DB or console.

---

### Phase 9 — Arranger & Polish

9.1 **A/B patterns**

* Duplicate to **A** and variant **B**; chain A,A,B,B; export respects chain.
* **Acceptance:** Arrangement plays sequentially; export matches.

9.2 **Onboarding & empty states**

* 3‑card carousel; “Try a demo project”.
* Hints on blank pads/keys/record.
* **Acceptance:** New user ships loop in <5 minutes.

9.3 **Hotkeys**

* Space play/stop; QWER pads; Z/X octave; +/- tempo.
* Help modal lists all.
* **Acceptance:** Works on desktop.

9.4 **Visual polish**

* Focus rings, accessible contrast; favicon from logo concept.

---

### Phase 10 — QA Gauntlet

10.1 **Timing & drift**

* 50 loop repetitions; verify bar boundary alignment (offline render exact).
* **Pass:** No audible drift; WAV length exact.

10.2 **Latency mode**

* Toggle during playback; stable; no glitches.

10.3 **AI validity**

* 20 Beat + 20 Melody gens: 100% JSON valid or graceful error.

10.4 **Recording sanity**

* Desktop & iOS/Android: record 1–4 bars → assign to pad → play in sync.
* Monitor on headphones only; UI warns.

10.5 **Error paths**

* Permission denied; offline; quota exceeded; invalid file; AI fail → helpful messages, app usable.

---

### Phase 11 — Demo & Submission

11.1 **Demo script (90s)**

1. **Record**: tap Record → 1‑bar count‑in → clap/snare on mic → stop → trim → send to Pad 1.
2. **Generate Beat** (lofi, 16 bars) → tweak swing → layer recorded clap on downbeats.
3. **Generate Melody** (A minor, 8 bars) → overdub one note.
4. Duplicate to **A/B**; chain A,A,B,B.
5. **Export MP3** → **Share link**; show latency readout + time‑to‑first loop stat.

11.2 **Backups**

* Save two demo projects; export WAV/MP3 backups.

11.3 **Submission pack**

* README (run steps, tech notes, licenses), 60–90s video, live link.

---

## Definition of Done (per feature)

* **Recording:** Permission request works; live meter; count‑in; bar‑sync record; trim; quantize‑to‑bar; assign to pad/keys; plays in sync; saved/reopened correctly (local & cloud).
* **Pads/Sequencer:** Add/remove hits; per‑step velocity; swing; quantize; no clicks.
* **Keys:** Scale lock; record/overdub; quantize; editable notes.
* **Sample Editor:** Upload/trim/slice; pitch/stretch; map to pads.
* **Mixer:** Track vol/pan; master soft‑clip guard; no clipping on export.
* **Export:** WAV & MP3 lengths exact; re‑import parity OK.
* **Saves:** Anonymous autosave & recovery; Login = cloud save + share link.
* **AI:** Beat & Melody editably generated; re‑roll; graceful failure.
* **Onboarding:** New user creates a loop in <5 minutes using hints.

---

## Risk Controls & Mitigations

* **Mic privacy & UX:** Ask permission only on click; show “Recording…” state; easy **Delete take**; all local unless logged‑in and user saves to cloud.
* **Feedback howl:** Monitor OFF by default; warn “use headphones to monitor.”
* **Mobile web quirks:** Require user gesture to start audio; keep UI concise; show bar‑sync status.
* **Licensing:** Bundle CC0 only; link to external packs in UI.
* **Time sink temptation:** New FX/collab/complex arranger = **out of scope**; push to backlog.

---
