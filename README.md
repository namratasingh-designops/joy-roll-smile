# Leo's Ludo Adventure

Build **Ludo: Play, Learn, Smile**, a 3D, touch-first Ludo game for children aged 5–7. Use the attached image as the visual target: a sunny, cosy playroom; a chunky Ludo board sitting in a wooden tray at the centre; a friendly lion mascot giving instructions in speech bubbles; player cards on the left; a big glowing Roll Dice button on the right; round Sound, Music, Voice and Settings buttons top-right; and a strip of kindness values along the bottom.

**The golden rule:** a 5-year-old who cannot read yet must be able to play a whole game without adult help. Every decision below follows from that. When in doubt, choose the option with fewer choices, bigger targets, and more encouragement.

## 1. Tech stack

- React + TypeScript + Vite + Tailwind.
- 3D: `@react-three/fiber` + `@react-three/drei`. The board, tokens and dice are real 3D meshes with soft lighting and gentle contact shadows. The camera is fixed at a ~40° tilt like the reference. No orbit/zoom controls (young kids get lost).
- UI motion: `framer-motion`. Celebrations: `canvas-confetti`.
- Sound: `tone.js`. Synthesize all sound effects and music in code so no audio files are needed.
- Voice: Web Speech API (`speechSynthesis`) reading from a pre-written line library. Every spoken line is also shown as a caption in the mascot's speech bubble.
- State: `zustand` store plus a pure TypeScript rules engine in `src/game/rules.ts` with no UI imports, covered by unit tests (Vitest).
- Model game flow as an explicit state machine: `idle → rolling → choosingToken → moving → resolving → nextTurn → gameOver`. Ignore taps that don't belong to the current state (prevents double-moves from excited tapping).
- No backend, no accounts, no analytics, no ads, no purchases, no external links. Save settings, stickers and the in-progress game in localStorage.

## 2. Rules: "Kid Mode"

Classic Ludo, softened for 5–7 year olds. All options live in the grown-up settings.

- **Board:** standard 15×15 cross layout, 52-square loop, a 6-square coloured home lane per colour, a centre home triangle. Safe squares = each colour's start square + 4 star squares.
- **Players:** 2–4. Default is the child as Blue plus 3 computer buddies (Red, Green, Yellow). "Play with family" mode = 2–4 humans passing one device.
- **Tokens per player:** 2 by default (a ~10-minute game, matching a young attention span) or 4 (classic).
- **Leaving base:** Easy (default) = a 1 or a 6 lets a token out. Classic = only a 6. In Easy, if the child hasn't been able to leave base for 3 turns in a row, the next roll lets a token out ("Lucky roll!").
- **Rolling a 6** = roll again. Drop the "three 6s loses your turn" rule.
- **Finishing:** Easy = any roll that reaches or passes home counts. Classic = exact roll needed.
- **Bumping:** landing on another player's token sends it back to base, framed as funny, not mean (see animations). A **Friendly mode** toggle turns bumping off so tokens can share squares.
- **Ending:** when the child gets all tokens home, celebrate immediately. Remaining buddies finish in a quick, skippable fast-forward. Places are shown as gold, silver and bronze medals plus a "Great try!" star ribbon. Every player gets a medal and the child always earns a sticker. Never show "You lose".

## 3. Turn flow (designed for a 5-year-old)

1. **Turn starts.** The active player's card grows and glows. The lion points at the dice and says "Your turn! Tap the dice!" If there's no tap for 4 seconds, a bouncing hand pointer appears over the dice.
2. **Roll.** Tap anywhere on the big dice button (or press Space/Enter; optional shake-to-roll on phones with a visible fallback). Pick the result first with `crypto.getRandomValues`, then play a ~1 second 3D tumble that lands on that face. The dice shows dots (counting practice) and a big numeral pops above it.
3. **Choose.** Only tokens that can move glow and bob; everything else dims slightly. If only one move is possible, move it automatically after a short pause. If no move is possible, the lion says "No moves this time. That's okay!" and play passes on.
4. **Move.** The token hops square by square. Each hop plays a rising pop note, shows the count number above the square, and the voice counts along ("One, two, three!"). This turns every move into counting practice.
5. **Land.** Star squares twinkle ("Safe spot!"). Entering the home lane leaves a rainbow trail. Reaching the centre triggers a mini firework, a fanfare, and fills a dot on the player card.
6. **Buddies' turns.** Relaxed pace (~2 s per turn), narrated in short lines, with the lion "thinking" while they decide. The child can tap anywhere to speed them up.

No countdowns, no time limits, no penalties for slow play.

## 4. Layout and screens

**Desktop and tablet landscape: match the reference composition.**
- Top-left: LUDO logo with a crown and a "Play, Learn, Smile" ribbon.
- Left column: 4 player cards (avatar, name, colour symbol, 4 dots showing tokens home). The active card is larger, glowing, and says "Your turn!".
- Centre: the 3D board in its wooden tray.
- Top-centre: the lion mascot with the main speech bubble.
- Top-right: Sound, Music, Voice, Settings (icon + label).
- Right: the Roll Dice button, the single most prominent thing on screen; a small lion helper with a hint bubble below it.
- Bottom: Exit (left), How to play (right), a "Let's play!" status banner, and the values strip: Be kind ⭐, Have fun ❤️, Play together 🙂, You can do it! 🌱.

**Phone landscape:** the board fills the height; player cards collapse to avatar chips; the dice button sits bottom-right in easy thumb reach; the mascot becomes a small corner avatar with bubbles.

**Phone portrait:** don't force rotation. Stack: top icon bar, a row of player chips, a square full-width board, and a full-width Roll Dice button in the bottom thumb zone.

Support 320px minimum width, notch safe-areas, and window resizing without losing the game.

**Screens:**
1. **Splash.** Logo bounces in, lion waves, one giant "Tap to play!" button. This first tap also unlocks audio.
2. **Who's playing?** Two big picture cards: "Play with buddies" and "Play with family".
3. **Pick your colour.** Four big coloured avatar cards. Tapping one says the colour name out loud.
4. **Game.**
5. **How to play.** An interactive 3-step tutorial the child *does*, not reads: tap the dice, tap the glowing token, watch it hop and count. The lion guides with voice. Replayable any time.
6. **Celebration.** Confetti, a trophy drop, the child's avatar dancing, a sticker earned, a big "Play again" button and a smaller "Home" button.
7. **Sticker book.** One sticker per finished game. No streaks, no pressure.
8. **Exit confirmation.** Two big picture buttons: "Keep playing" (primary, green) and "Leave". The game auto-saves so it can be resumed.
9. **Grown-up settings,** behind a parental gate ("What is 6 × 4?" with number buttons). Options: tokens per player, Easy/Classic rules, Friendly mode, buddy speed, voice speed, separate volumes, reduced motion, high contrast, larger UI, left-handed layout (dice button moves left), break reminder on/off.

Auto-pause and mute when the tab or app is hidden.

## 5. Visual design

- **Mood:** warm, sunny, toy-like. Everything looks squeezable: soft rounded corners, glossy plastic, light wood.
- **Palette** (keep these hues, darken shades where needed to pass contrast):
  - Blue `#2E7CF6`, Red `#F2434F`, Green `#1FB45A`, Yellow `#FFC629`
  - Panels `#FFF7E8`, wood `#D39A5B` / `#A86B35`, text navy `#1F2B5C`, sky `#8FD3FF`
- **Type:** Fredoka for logo, headings and buttons; Nunito for everything else. Minimum 18px body, 24px button labels, 36px banners. Sentence case.
- **Buttons:** chunky, with a darker bottom edge that squishes down on press. Every button has an icon and a label.
- **Background:** a soft, slightly blurred playroom (window with sky, shelves, plants, toy blocks, a rug) built from simple SVG/CSS layers with a little parallax. Keep it lower in contrast than the board so the board always wins attention.
- **Board:** glossy plastic tiles in a wooden tray; each base is a raised rounded pad with token slots; tokens are chunky pawns with a shiny highlight and their colour's symbol on the head.
- **Mascot:** an original friendly cartoon lion called Leo, built as an SVG React component with expressions: happy, cheering, thinking, surprised, clapping, waving, pointing. Keep it in its own component so custom artwork or Lottie files can replace it later.
- Spend the boldness on the board and dice. Keep the UI around them calm and consistent.

## 6. Animations

Bouncy and cartoony with squash and stretch. UI transitions 200–500 ms. Nothing blocks the child for more than ~1.5 s.

- **Dice:** idle wiggle to invite a tap; 3D tumble with bounces; landing thud with a sparkle burst; numeral pop.
- **Tokens:** glow and bob when movable; arc hop per square with a squash on landing and a tiny dust puff.
- **Bump:** the bumped token springs up, does a silly spin, and flies back to base in an arc with a "boing". The bumping token does a small twirl. The lion says "Whoops! Back home for a bounce!" and the bumped player's card shows "You can do it!".
- **Star square:** twinkle. **Home lane:** rainbow trail. **Home:** slide into the centre with a mini firework.
- **Win:** full-screen confetti, trophy drop, dancing avatars, sticker flying into the sticker book.
- **Mascot:** idle blink and breathing, points at the next action, claps on 6s and good moves, thinks during buddy turns.
- **Buttons:** press squish, gentle lift on hover (desktop only).
- **Turn change:** player card slides forward; the board edge glows in the active colour.
- **Reduced motion:** when `prefers-reduced-motion` is set or the setting is on, replace tumbles, hops and confetti with quick fades and static highlights. No information may be lost.
- Nothing flashes more than 3 times per second.

## 7. Sound, voice and haptics

Three separate toggles, exactly like the reference: Sound, Music, Voice.

- **Sound effects:** dice rattle and soft thud; a pop per hop rising in pitch; star chime; bump "boing" with a slide whistle; home fanfare; button blip; winning jingle.
- **Music:** a gentle, looping, major-key marimba/ukulele-style tune at about 30% of effects volume. It ducks while the voice speaks.
- **Voice:** warm and slightly slow (rate ~0.9, pitch ~1.15). Lines are 6 words or fewer, with 2–3 variants per event so it doesn't get repetitive. Examples: "Your turn! Tap the dice!", "You rolled a four!", "Tap a glowing token!", "One, two, three, four!", "Safe spot!", "Home sweet home!", "Whoops! Back home for a bounce!", "Red's turn!", "No moves this time. That's okay!", "You did it, superstar!".
- Audio starts only after the first tap on the splash screen and pauses when the app is hidden.
- **Haptics:** short `navigator.vibrate` pulses on roll, landing and win where supported; skip silently elsewhere.

## 8. Accessibility (target WCAG 2.2 AA)

- **Colour is never the only cue.** Each colour has a symbol shown on its tokens, base, home lane and player card: Blue ● circle, Red ♥ heart, Green ▲ triangle, Yellow ■ square.
- **Touch targets:** at least 64×64px (Roll Dice at least 120px), 12px+ spacing. Tokens get an enlarged invisible hit area. Tap only: no drag, double-tap, long-press or multi-finger gestures.
- **Contrast:** text at least 4.5:1; large text and icons at least 3:1. Use darker shades for text on coloured buttons.
- **Keyboard:** the whole game is playable without a mouse. Space/Enter rolls; Tab/arrow keys cycle through movable tokens; Enter moves; Esc opens pause. Thick, high-contrast focus ring.
- **Screen readers:** mirror the 3D canvas with an accessible DOM layer: an `aria-live="polite"` region announcing events ("Blue rolled 4. Two tokens can move.") and real buttons for movable tokens ("Blue token 2, on square 14, move to square 18"). Label the canvas.
- **Pre-readers:** every instruction is voiced, captioned, and paired with an icon or animation.
- **Cognitive load:** one clear action at a time; only relevant things are tappable during a turn; buttons never move between screens.
- **Motor:** no time limits, generous hit areas, taps debounced during animations.
- Options for high contrast, larger UI, reduced motion, left-handed layout; captions always on.
- Run axe checks and aim for a Lighthouse accessibility score of 95+.

## 9. Child psychology and ethical design

- Praise effort and skills, not only winning ("Great counting!", "Nice choice!").
- Losing feels safe: no sad sounds, no "you lose", bumps are silly moments, and buddies who are ahead occasionally cheer the child on.
- Short sessions by default. After 20 minutes, Leo suggests a stretch break with a little dance (dismissible; grown-ups can turn it off).
- Give the child real choices where it's meaningful (colour, avatar, which token when there's a genuine choice) and remove choices where it isn't.
- In family mode, show a hand-off screen ("Pass it to Red!") with a "Ready?" tap so the next child doesn't tap by accident.
- No dark patterns: no ads, purchases, streaks, loot boxes, notifications or data collection (COPPA and GDPR-K friendly).

## 10. Devices and performance

- Works on iOS Safari, Android Chrome, and desktop Chrome, Edge, Firefox and Safari, with touch, mouse or keyboard.
- Target 60fps on mid-range phones: low-poly models, soft contact shadows instead of real-time shadow maps, device pixel ratio capped at 2, lazy-loaded 3D scene with a spinning-dice loader.
- Adaptive quality: if frame rate drops, turn off shadows and effects automatically.
- If WebGL isn't available, fall back to a 2.5D CSS/SVG board with identical rules and UI.
- Installable PWA with offline play. Auto-save so a refresh or accidental exit resumes the game.

## 11. Build order

Build in this order and make sure each step works before moving on:
1. Rules engine and state machine with unit tests (entering, moving, bumping, safe squares, home lane, extra turn on 6, Easy/Classic, Friendly mode).
2. 3D board, tokens and dice at the reference camera angle.
3. Turn flow, tap interactions, computer buddies.
4. Responsive layout for all breakpoints, matching the reference.
5. Animations, then sound and voice.
6. Tutorial, celebration, sticker book, grown-up settings.
7. Accessibility layer, reduced motion and high contrast.
8. Performance pass and WebGL fallback.

## 12. Done when

- A child gets from splash to first dice roll in 2 taps or fewer.
- A full 2-token game against buddies takes about 8–12 minutes.
- The whole game can be played with sound off (captions and visuals carry everything) and by a colour-blind child (symbols carry everything).
- The whole game can be played with keyboard only.
- Nothing on screen says "lose", "fail" or "wrong".
- No tap during an animation ever causes a wrong or double move.
- It looks and works right at 320px, 768px, 1024px and 1440px wide, in both orientations.

---

## Follow-up prompts (use after the first build)

Lovable works best in rounds. After the first version runs, send these one at a time:

**1. Polish pass**
> Compare the game screen with the reference image side by side. Make the board bigger and glossier, the Roll Dice button more prominent with a glowing ring, and the player cards closer to the reference. Tune every animation to feel bouncier with squash and stretch.

**2. Five-year-old test**
> Play a whole game pretending you're a 5-year-old who can't read. List every moment where you wouldn't know what to do next, then fix each one with voice, an animated hand pointer, or by removing the choice.

**3. Accessibility audit**
> Audit the app against WCAG 2.2 AA. Check contrast of every text and icon, keyboard-only play, screen reader announcements, reduced motion, and the colour symbols on tokens. Fix every issue and list what you changed.

**4. Device pass**
> Test layouts at 320, 375, 414, 768, 1024 and 1440px in portrait and landscape. Make sure the dice button is always in thumb reach on phones, nothing overlaps the board, and the game runs smoothly on a mid-range phone. Turn down 3D quality automatically if frame rate drops.

**5. Sound pass**
> Make the sound effects more cheerful and toy-like, make sure music ducks under the voice, add 2–3 variants for every voice line, and check that Sound, Music and Voice toggles each work independently and are remembered.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://joy-roll-smile.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d6b393c4-c34d-439f-92ed-a68b3ff75f98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
