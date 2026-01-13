<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1qwX5qfvraF32TZDe9MGoV0KWOcQPwCI9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🎛️ How to Use Audio-X

### The Decks (A & B)
* **Play/Pause:** Starts or stops the music.
* **CUE:** "Stutter Play." Hold it to play from the start point; let go to snap back to the start. Used to set the beat before dropping the song.
* **Sync:** The "Autopilot." Automatically matches the speed (BPM) of this deck to the other deck so they beat-match perfectly.

### The Mixer (Center)
* **Crossfader (Bottom Slider):** The most important tool. Slide **Left** to hear Deck A, **Right** to hear Deck B, or **Center** to hear both.
* **Volume Faders (Vertical):** Control the loudness of each specific deck.

### EQ (The Knobs)
* **HI (Highs):** Controls sharp sounds (Hi-hats, vocals). Turn down to "muffle" the track.
* **MID (Mids):** Controls the main melody and vocals.
* **LOW (Lows):** Controls the Bass and Kick drum.
    * *Pro Tip:* Never have the LOW knobs of *both* songs up at 100% at the same time, or the audio will distort (clipping). Swap the basslines!
