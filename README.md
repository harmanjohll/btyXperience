# The Beatty Experience

The Open House show for Beatty Secondary School: one big screen, every phone in the hall following it.
Phones answer polls, fold a paper boat in four beats, name it, set sail together, and at the end the boat unfolds
into a letter from the visitor's 2030 self, written from their own answers.

## The show (use this one)

| What | File | Address |
| --- | --- | --- |
| Big screen | `gem/index.html` | `…/btyXperience/gem/?presenter=true` |
| Phones | `gem/join/` | `…/btyXperience/gem/join/` (the QR on the big screen points here) |
| Presenter view (notes, clock, "42 of 60 voted") | `gem/speaker.html` | press `N` on the big screen |
| The slides, as a plain list of words | `gem/deck/slides.js` | edit words here; no code needed |

Without `?presenter=true` the big screen is a mirror: it shows the show but does not drive the phones.

### On the day

1. Open the big screen address in Chrome, press Begin, press `N` for the presenter view.
2. **Between the two sessions press Reset** (start screen, type RESET). It starts a new show:
   the counts go back to zero, new phones join as usual, and every phone from the first session **keeps its letter**.
3. If the big screen ever misbehaves, open the fallback (below). The phones carry on following; nobody scans again.

### Before the day: four blanks to fill

| Where | What |
| --- | --- |
| `gem/join/app.js`, `SCHOOL_CODE` | Beatty's S1 Posting school code. It replaces "Make Beatty your 1st choice" on the letter's gold stub. |
| `gem/join/app.js`, `CHOICE_WINDOW` and `CHOICE_OPENS` | The S1 choice dates. The stub shows them and the phone offers "Remind me when choices open". |
| `gem/join/app.js`, `CARD_LINKS` | The feedback link is last year's (`go.gov.sg/oh25survey`). Change it here and in `gem/deck/slides.js`. |
| `gem/index.html`, `JOIN_SHORT` | A short link to `gem/join/` (for example a go.gov.sg link), shown under the QR for anyone who cannot scan. |

## The fallback (the show exactly as it was on 13 Nov 2026)

| What | File | Address |
| --- | --- | --- |
| Big screen | `gem/v2.html` | `…/btyXperience/gem/v2.html?presenter=true` |
| Phones | `gem/x/v2.html` | `…/btyXperience/gem/x/v2.html` |

These files are untouched. The same snapshot is also kept on GitHub as the branch `backup/openhouse-v2-13nov2026`.
The fallback and the show share one saved state, so either big screen can drive phones that joined on either page.
Use one big screen at a time.

## What the audit changed in the show

* One name: The Beatty Experience. No "Version 2" on any screen.
* The keepsake is no longer a card. The boat each visitor folded unfolds into a letter from their Sec 4 self,
  written from what they chose tonight: their bee, their one tap answers, their poll guesses, their exchange and
  attachment picks, their word, even their own question. Their words appear as handwriting.
  The wording lives in `letterParas()` in `gem/join/app.js`.
* Its links can be tapped, it saves as an image, and it survives a second session.
* It lands straight after "Choose Beatty!". How to choose a school (MOE's advice, ranking, tie breakers) follows it.
* A quiz poll counts votes but hides the split until the reveal.
* Phones can ask a question at any time; the "Your questions" slide shows them. Click a question to bring it to the front; click its cross to hide it.
* Three more one tap questions inside the long stretches (Makerspace, habits, enrichment).
* The phone names the same chapter as the big screen's roadmap.
* The repeated "8" fun fact is gone; the phone no longer shows the answer before the DREAM poll.

## Still to confirm (facts only the school knows)

* Industry partners: the logo slide shows 8, the poll and the pass say 6, the map offers 6 (a different set), and Hive Rush says 7 and 7.
* Exchange names differ between the globe and the map slide (New Zealand; Mihara, Japan).
* "Express", "4E" and "4N" appear beside the Full SBB slide.
* Lines marked `[confirm]` in the notes of `gem/deck/slides.js`.

## Everything else in this repository

| Folder | What it is |
| --- | --- |
| `games/hiverush/` | Hive Rush, the booth quiz game. Stands alone; see `games/README.md`. |
| `gem/btx27.html`, `gem/joinbtx27.html`, `gem/x/index.html`, `gem/deck/content.js` | Version 1 of the show. Kept until the Open House is over. |
| `gem/sail/`, `experience/`, `app/`, `content/`, `data/` | Earlier prototypes and source material. Not used by the show. |
| `tests/` | `npm test` plays the whole show with a stand in database. `node tests/run.mjs show` checks the show alone. |

After the Open House: delete version 1, the fallback and the earlier prototypes in one sweep, then rename `gem/` to `show/`.
`gem/x/fleet.*` and `gem/x/boat.js` are still used by the show (the fleet at sea), so keep those.
