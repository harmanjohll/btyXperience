# Games

Stand alone games for BTY outreach. Each game lives in its own folder and shares nothing with the rest of this repo.

## Hive Rush (`hiverush/`)

A live quiz race for Primary 6 visitors at a booth: one host screen, a few player devices, 1 to 3 children per device. Six rounds, about 3 minutes, then a podium and an Open House invitation.

| File | What it is |
| --- | --- |
| `hiverush/host.html` | Facilitator screen: laptop, TV or tablet. Creates the Game PIN, runs the game, shows the podium and the Open House QR. |
| `hiverush/index.html` | Player screen: every booth tablet or phone. |
| `hiverush/print.html` | Printable A4 sheets: 8 Golden Tickets (champions) and 8 Hive Passes (every player). Print in colour, cut on the dashed lines. |
| `hiverush/js/content.js` | Every question, fact, squad name and the Open House details. Edit words here; no code changes needed. |

### At the booth

1. Open `host.html` on the facilitator device and press **Create a game**. A 4 digit PIN appears.
2. On each player device open `index.html` and type the PIN. You do this once per device; the device remembers it.
3. Children name their squad with the dice and an avatar (no typing), then tap **WE'RE READY!**
4. Press **START** on the host. The game runs itself: intro, question, reveal, leaderboard, six times, then podium and finale.
5. Hand out prizes: every device ends on a "Show this screen to collect your prize" card with its place and score. Golden Ticket for the champions, Hive Pass for everyone.
6. Press **Next group**. Every device returns to the squad screen with the PIN kept.

The host bar (bottom right) has Pause, Next (skip ahead), New group, sound, and fullscreen. On the host lobby, tap a squad to remove it (for example a device nobody is using).

The host keeps a **booth record** for the day. Each new group sees "Today's booth record: 6,120 by Turbo Bees. Can you beat it?", and a winning squad that beats it gets a NEW BOOTH RECORD stamp.

### Hosting

All files are static. Serve the `games/hiverush` folder from anywhere: GitHub Pages (if it is turned on for this repo, the address would be `…github.io/btyXperience/games/hiverush/`), any web server, or open the files directly. Live play needs internet, because it syncs through the project's existing Firebase (collection `hiveRush`, separate from everything else). Fonts and images are bundled, so nothing else is fetched.

If a device cannot connect, it offers **Play solo**: the same six rounds offline, scored against that device's best scores of the day. You can also open `index.html?solo` directly.

### Before the day (10 minutes)

- Do a rehearsal on the actual WiFi or hotspot: one host and two devices, through to the finale. School networks sometimes block `firestore.googleapis.com`; a phone hotspot avoids that.
- Lock the tablets to the game: iPad Guided Access (triple click the side button) or Android screen pinning. Keep them charging; the game keeps the screen awake while open.
- Set volume to about half. The host plays music; devices play short sound effects only.
- Facilitator escape hatch: on a player device, hold the crest (top left) for 2 seconds to leave the game.
- If the repo's `gem/firestore.rules` is ever deployed, it now includes a `hiveRush` block so the game keeps working.

### The rounds

| # | Round | Mechanic | BTY message |
| --- | --- | --- | --- |
| 1 | Quick Pick | Tap 1 of 4 | The bee on our crest: hard work behind every success |
| 2 | Myth or Fact | Swipe 3 cards | NEXUS@BTY and A.I. for every student, 17 CCAs, A*STAR attachment |
| 3 | Closest Wins | Slider guess | 9 in 10 get their 1st or 2nd choice CCA |
| 4 | Spell the Dream | Tap in order | DREAM values |
| 5 | Passport Hunt | Pop floating bubbles | 7 international exchanges, 7 industry attachments |
| 6 | Golden Round ×2 | Tap 1 of 4 | Non Vi Sed Arte |

Facts come from `experience/shared/data.js` and the school website copies in `content/raw/`. Please check the 9 in 10 CCA figure and the 17 CCA count are still current before the day.

### Why it is built this way

- **No typing, no failure state.** Children pick from generated squad names. A wrong answer gets "Shake it off. The next one's yours!" plus a fact. Effort always earns some honey.
- **Six different mechanics.** Each round feels new, so attention never settles into routine.
- **Near miss leaderboards.** "Only 120 behind Turbo Bees!" keeps every squad in the race; the Golden Round's double points keep the comeback possible.
- **Peak and end.** People remember the best moment and the ending most, so the podium has a drumroll and confetti, and the finale invitation is the last thing every child sees, carried home on paper.
- **An open loop for the parents.** The ticket's mission ("ask a Beattyian what they love most about Beatty") can only be finished at Open House.

### Testing

```bash
node games/hiverush/test/run.mjs
```

This plays a full game with a host and three devices (phone, tablet portrait, tablet landscape) through a local Firebase stand in, then checks a new group, a player reloading, solo mode, and the offline fallback. Screenshots go to `games/hiverush/test/out/`.
