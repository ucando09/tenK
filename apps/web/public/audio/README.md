# Vibe audio files

Drop MP3 files in this folder. The player picks them up automatically
based on the `audioSrc` field in
[`apps/web/src/lib/constants.ts`](../../src/lib/constants.ts).

## Single track per vibe (default)

For most vibes, one long looping MP3 is enough. Use these exact names:

| File name        | Vibe (in app)  |
|------------------|----------------|
| `fireplace.mp3`  | 🔥 Fireplace   |
| `forest.mp3`     | 🌲 Forest      |
| `library.mp3`    | 📚 Library     |
| `cafe.mp3`       | ☕ Coffee Shop |
| `rain.mp3`       | 🌧️ Rainfall    |

Single-track vibes loop forever — a 30-minute file is fine for a
multi-hour session.

## Multiple tracks per vibe

For vibes where you want variety (lo-fi, for example), give the vibe an
**array** of paths. The player picks a random track each time the
previous track ends, so the same vibe stays fresh across long sessions
without repeating the same song back-to-back.

The shipped Lo-Fi vibe expects three files by default:

```
lofi-1.mp3
lofi-2.mp3
lofi-3.mp3
```

Want 5 tracks for Rain too? Two steps:

1. Drop the files: `rain-1.mp3`, `rain-2.mp3`, `rain-3.mp3`, `rain-4.mp3`, `rain-5.mp3`
2. Update the `rain` entry in `apps/web/src/lib/constants.ts`:
   ```ts
   {
     id: 'rain', label: 'Rainfall', icon: '🌧️', /* ... */
     audioSrc: [
       '/audio/rain-1.mp3',
       '/audio/rain-2.mp3',
       '/audio/rain-3.mp3',
       '/audio/rain-4.mp3',
       '/audio/rain-5.mp3',
     ],
   }
   ```

Naming convention `{vibe}-{n}.mp3` is just a suggestion — you can name
the files anything as long as the paths in `constants.ts` match.

## Notes

- `Silence` has no audio file by design.
- Files are streamed via HTML5 `<audio>` with `preload="metadata"`, so
  a 10-hour file never loads fully into memory. Only the chunks the
  user actively listens to are downloaded.
- Multi-track vibes deliberately avoid replaying the same track twice
  in a row. With only one track configured (or `audioSrc` set to a
  string instead of an array) the player falls back to native looping.
- If a configured file is missing, the focus-mode footer shows a hint
  pointing at the expected path — easy to debug.
