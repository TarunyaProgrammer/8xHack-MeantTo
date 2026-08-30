# Meant To — PRD

**One-liner:** 312 screenshots. One button. Done.

**What it is:** an agent that reads your Screenshots folder, tells you the truth
about it, then empties it by actually performing the actions.

**Event:** 8x Mobile App Hackathon. Kickoff 10:30, submit 15:00, demos 16:30,
pitches 17:30. Build window ~4.5 hours. Tracks announced at kickoff.

---

## 1. Problem

People screenshot things as a way of saying "deal with this later." A wifi
password, an address, a product, an event poster, a number in a chat, a
message they owe a reply to. Later never comes.

The Screenshots folder is the largest to-do list most people own and it has no
interface. It is not a photo album — it is a backlog of unfinished intentions,
and it grows every day.

**Why now / why nobody solved it:** existing tools treat the camera roll as a
gallery. Apple and Google help you *find* a screenshot. Nobody helps you
*finish* one. Cleanup apps delete; they don't act.

**Target user:** anyone with a phone. Genuinely universal — the demo test is
"open your Screenshots folder right now," and it works on every person in the
room. Skews 16–30 for the shareable roast.

---

## 2. The differentiator

Every comparable product **organises**. This one **acts**.

A judge hearing "screenshot app" assumes an organiser. The pitch turns when
one button visibly changes their actual phone — contacts appear in Contacts,
events appear in Calendar — in a live cascade.

Positioning line: *it is not a folder, it is a backlog, and we clear it.*

Secondary fit: 8x's own engineering culture is built around directing and
verifying AI agents. An agent that empties a backlog speaks to the host.

---

## 3. Feature list

### P0 — must ship. Without these there is no demo.

**F1. Scan**
Read the Screenshots album via `expo-media-library`. Both iOS and Android
expose Screenshots as its own smart album, so this is a one-line filter, not a
classification problem. Cap at the 50 most recent for the live run.

**F2. Extract**
One vision call per screenshot returning strict JSON. Six types only:
`contact | event | wifi | place | link | reply_owed`, plus `junk` for
memes and noise. Anything unparseable falls back to `junk`.

**F3. The Verdict (the funny screen)**
Aggregate real counts into a roast. All numbers computed, never invented.
Example:
> 312 screenshots · 84 things to buy · 41 apartments · 12 gym memberships
> You did 3 of them.

Runs BEFORE the button so the laugh lands before the payoff.

**F4. One-Button Execute (the crazy screen)**
Single primary action. Performs every safe action in sequence with a visible
cascade of ticks. This is the demo.

**F5. Results**
What was done, what was recovered, what still needs a tap.

### P1 — only if ahead at 14:00

**F6. Card review** — swipe per item: Do it / Delete it. No "later" option;
the joke is that "later" is how the pile got to 312.
**F7. Wrapped share card** — one image: totals, completion rate, "your type."
Free distribution, same format people already share unprompted.

### P2 — will not build. Say so in the pitch.

- Auto-sending messages or emails. Drafts only. Firing messages at real people
  without confirmation is wrong and it will wreck a live demo.
- Accounts, auth, cloud sync, backend.
- Full camera-roll processing. Screenshots album only.
- Background/scheduled scanning.
- Any action that spends money.

---

## 4. Action matrix — what actually executes

| Type | Extracted | Action | Real write? |
|---|---|---|---|
| `contact` | name, phone | Save to Contacts | **Yes** — `expo-contacts` |
| `event` | title, datetime | Add to Calendar | **Yes** — `expo-calendar` |
| `wifi` | ssid, password | Save to in-app vault + clipboard | Local |
| `place` | name, address | Save to list, one-tap Maps | Local + `Linking` |
| `link` | url, price | Stage, one-tap open | Local + `Linking` |
| `reply_owed` | person, context | Draft reply text | Draft only |
| `junk` | — | Offer bulk delete | Local |

Contacts and Calendar are the two genuine writes and they carry the demo —
the judge can open their own Contacts app and see the change. Lead with those.

**Money recovery:** sum prices found across `link` items and flag any with an
expiry date. Report honestly as best-effort ("we found ₹4,200 in offers; ₹1,100
still valid"), never as a guaranteed figure.

---

## 5. Screens

1. **Splash / permission** — one line, one button.
2. **Scanning** — counter ticking up, "reading your evidence…". This is a demo
   beat, not dead time. Do not hide it.
3. **Verdict** — the roast. Single card, big numbers. One button: "Fix it".
4. **Executing** — the cascade. Ticks landing one at a time, ~150ms apart.
   Deliberately paced so the room can read it.
5. **Results** — what changed, what's left, share button.

Five screens total. Anything more is scope creep.

---

## 6. Data model (local, AsyncStorage)

```
Item {
  id, assetId, uri, takenAt,
  type,            // contact | event | wifi | place | link | reply_owed | junk
  payload,         // type-specific extracted fields
  status,          // pending | done | dismissed
  roastLine        // one-line snark, generated with the extraction
}

Session { scannedAt, counts, totalValue, executed[] }
```

---

## 7. Prompts

**Extraction** (per screenshot, vision):
Return strict JSON `{type, payload, roastLine}`. `roastLine` must reference a
concrete detail — elapsed time, price, repetition. Two sentences maximum.
Unparseable → `junk`. Never invent a field that isn't visible.

**Verdict** (once, over the aggregate counts):
Input is the count table only, not the images. Specific and a little cruel.
"You did 3 of them" lands; "you have many unfinished tasks" dies.

Tone rule for both: **never write the joke — find the number that is already
true and put it in a big font.** ₹2,47,000, 847 days, 14 times, 2:47 AM. The
user's own data is funnier than anything generated.

---

## 8. Tech

Expo (Expo Go, no dev build), React Native.
`expo-media-library`, `expo-contacts`, `expo-calendar`, `expo-clipboard`,
`expo-linking`, AsyncStorage, Reanimated.
One vision-capable model for extraction, one text model for the verdict.

**Known platform limits — do not design around these:**
- iOS gives no call or message history. Any "you never replied" stat is not
  computable. Drop it.
- No API to write Apple Notes. Wifi passwords go to an in-app vault.
- Cannot auto-send SMS/WhatsApp. Draft only.
- Photo library permission is required; rehearse the grant flow so it doesn't
  eat demo time.

**Auth note:** a React Native app cannot use the local `claude` binary's OAuth
session — nothing to spawn on device. This needs an API key in the app for the
hackathon only. Never ship that way; put the key behind a proxy for a real
version.

---

## 9. Timeline

| Time | Deliverable |
|---|---|
| 10:30–11:10 | Screenshots album pulled, grid renders. **Gate:** real screenshots visible by 11:10 or rethink. |
| 11:10–12:15 | Extraction → typed JSON, cached. Never re-process an asset. |
| 12:15–13:00 | Lunch. Write verdict copy on paper. |
| 13:00–13:45 | Verdict screen with real aggregates. |
| 13:45–14:30 | One-button execute + the cascade. Contacts and Calendar writes working. |
| 14:30–14:50 | Results screen, polish, haptics. |
| 14:50–15:00 | Submit. No tuning after 14:50. |

**Cut list, in order:** Wrapped card → card review → `reply_owed` → `place`.
Never cut: scan, verdict, one-button execute.

---

## 10. Demo script (90s)

1. Run live on your own phone. Real folder, real numbers. The verdict screen
   gets the laugh because every person watching has the same folder.
2. Press the button. Let the cascade play — don't talk over it.
3. Open the phone's actual Contacts app and show the new entries. **This is
   the proof beat.** It's the moment it stops being a mockup.
4. Line: "Your camera roll's biggest album is a to-do list nobody built an app
   for. We just emptied it."

Pre-demo checklist: phone charged, airplane-mode fallback screenshots ready,
permission already granted, 50-item cache warm.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Extraction too slow on 50 images | Batch, cap at 50, cache aggressively, make the scan screen a demo beat |
| Venue wifi dies mid-demo | Pre-warm the cache before pitching; screen recording as backup |
| Verdict reads generic | Write the copy before kickoff; force real numbers only |
| Judge assumes "just an organiser" | Lead the pitch with the button, not the scan |
| Contacts/Calendar permission prompt mid-demo | Grant both before going on stage |
| Privacy question from judges | Answer honestly: processing is per-screenshot, nothing is stored server-side, no account. Have this answer ready — it will be asked. |

---

## 12. Success criteria

- Scans a real 50+ screenshot folder and produces a verdict in under 30s
- One button produces at least 5 visible, real changes to the phone
- A judge opens their own Contacts app and sees an entry that wasn't there
- At least one laugh on the verdict screen
