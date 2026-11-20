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
2. At the card step the Next button reads **Unfold together**. Ask the hall to hold their phones up, then press it:
   the screen counts 3, 2, 1 and every boat opens into its letter at the same moment.
3. At Set Sail, give the room a full minute or two to write on their hulls. The presenter view shows how many boats are
   named and turns gold at 4 in 5; if you press SET SAIL earlier, the first press only tells you the count.
4. **Between the two sessions press Reset** (start screen, type RESET). It starts a new show:
   the counts go back to zero, new phones join as usual, and every phone from the first session **keeps its letter**.
5. If the big screen ever misbehaves, open the fallback (below). The phones carry on following; nobody scans again.

### The links the show uses

| Where | What |
| --- | --- |
| `gem/join/app.js`, `CARD_LINKS` | The feedback link, `go.gov.sg/btyssoh26survey`. It is also on the "Your voice matters" slide in `gem/deck/slides.js`, whose QR is the official picture `gem/deck/img/f/survey-qr.png`. |
| `gem/index.html`, `JOIN_SHORT` | The official short link, `go.gov.sg/btyoh26` (it leads to `gem/join/`). Every join QR on the big screen is the official GO.gov.sg code, `gem/join-qr.png`, and the link is written beside it for anyone who cannot scan. If the link ever changes, change `JOIN_SHORT` and replace that picture. |

## The fallback (the show exactly as it was on 13 Nov 2026)

| What | File | Address |
| --- | --- | --- |
| Big screen | `gem/v2.html` | `…/btyXperience/gem/v2.html?presenter=true` |
| Phones | `gem/x/v2.html` | `…/btyXperience/gem/x/v2.html` |

These files are untouched. The same snapshot is also kept on GitHub as the branch `backup/openhouse-v2-13nov2026`.
The fallback and the show share one saved state, so either big screen can drive phones that joined on either page.
Use one big screen at a time.

## The backup deck (PowerPoint, no phones, no internet)

If the show cannot run at all, there is a PowerPoint copy of it: every slide, with its animation, and nothing that needs a phone.
It is made from the show itself, so make it again after any change to the slides:

```
node tools/backup-deck/capture.mjs            records every slide as a short video (about 15 minutes)
python3 tools/backup-deck/build_pptx.py       the animated deck
python3 tools/backup-deck/build_pptx.py --stills   the same slides as pictures only
```

Both files land in `tests/out/backup-deck/`. In the animated deck each slide is one video that plays by itself and rests on its
last frame; one press moves on. The quizzes become a show of hands (question, then answer), and the value cards turn one per press.
The boat, the fleet, the live maps and the letter are left out. The opening video is a link (it is on YouTube).

## What the audit changed in the show

* One name: The Beatty Experience. No "Version 2" on any screen.
* The keepsake is no longer a card. The boat each visitor folded unfolds into a letter from their Sec 4 self,
  written from what they chose tonight: their bee and bee quiz answers, their poll guesses, their exchange and
  attachment picks, their word. Their words appear as handwriting.
  The wording lives in `letterParas()` in `gem/join/app.js`.
* The whole hall unfolds together, on the big screen's count; the big screen then counts the letters opened.
* Its links can be tapped, it saves as an image, and it survives a second session.
* It lands straight after "Choose Beatty!". How to choose a school (MOE's advice, ranking, tie breakers) follows it.
* Three quiz polls only (DREAM, the CCA share, 8 and 6), plus the globe and the map picks. A quiz poll counts votes but hides the split until the reveal.
* The join code stays in the top right corner for latecomers; click it to show it full screen.
* There is no questions slide, so the phones no longer offer "Ask a question" (`ASK_ON` in `gem/join/app.js` brings the button back; a slide `{ kind:'live', show:'questions' }` shows what is asked).
* The light pages are oat paper with a faint honeycomb (they had diamonds), with hairlines where there were shadows.
* The phone names the same chapter as the big screen's roadmap.
* The repeated "8" fun fact is gone; the phone no longer shows the answer before the DREAM poll.

## Still to confirm (facts only the school knows)

* **Exchange module codes.** The exchanges are listed in module order. Only four codes are known (NX3011 Mihara, NX3012 Mutsuzawa,
  NX3014 Aorere College, NX3015 Geography in Bali). South Korea is placed third, then Literature in Bali, Estonia and Hanoi after
  NX3015: correct the order in `gem/deck/slides.js` (the map) and in the step list in `gem/index.html` (the globe) if that is wrong.
* **Continuous improvement photos.** New images are wanted: replace `gem/deck/img/e/future-1.jpg`, `future-2.jpg`, `future-3.jpg`.
* **Canteen plates.** The eight labels on "Wide selection. Nutritious. Yummy!" (Noodles, Tandoori & naan, and so on) are read off the photos.
  Correct each `cap` in `gem/deck/slides.js`; delete a `cap` to show that plate with no label. The round photos are in `gem/deck/img/e/food/`
  (640 px, about 70 KB each; the originals stay in Google Drive, folder "Canteen").
* **Beatty Express.** It replaced "Reading the news" and has no description line yet.
* The partner logo slide shows 8 logos: partners, not the 6 attachments.
* "Express", "4E" and "4N" appear beside the Full SBB slide.
* Lines marked `[confirm]` in the notes of `gem/deck/slides.js`.

## Everything else in this repository

| Folder | What it is |
| --- | --- |
| `games/hiverush/` | Hive Rush, the booth quiz game. Stands alone; see `games/README.md`. |
| `gem/x/fleet.*`, `gem/x/boat.js` | The fleet at sea, shown inside the big screen at Set Sail. Used by the show and by the fallback. |
| `tests/` | `npm test` plays the show with a stand in database: `show` (end to end), `layout`, `motion`, and `v2` (the fallback). |

Version 1 and the earlier prototypes (`btx*.html`, `gem/sail/`, `experience/`, `app/`, `content/`, `data/`) were retired on 15 Nov 2026.
They remain in the history and on the branch `backup/openhouse-v2-13nov2026`.

After the Open House: delete the fallback (`gem/v2.html`, `gem/notes.html`, `gem/x/v2.html`, `gem/x/app-v2.js`, `gem/deck/content-v2.js`,
`gem/card-sample-v2.jpg`), then rename `gem/` to `show/`.
