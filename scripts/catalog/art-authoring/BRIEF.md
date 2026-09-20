# Brief — author `concept` + `image` for Sudanese-curriculum chapters

You are assigning artwork to textbook chapters of the Sudanese national curriculum (grades 1–11).
For every chapter in your slice you choose two values. Nothing else is in scope: no descriptions,
no objectives, no question banks.

All paths below are inside `SD_AUTH` =
`/private/tmp/claude-501/-Users-abdout-hogwarts/006259de-7ecb-4c19-92af-66cc8231b3aa/scratchpad/sd-auth`

## Inputs (read these first)

| File | What it is |
| --- | --- |
| `slices/<your-batch>.json` | Your subjects → chapters → lessons. `title` is Arabic; `titleEn` may be null — then read the Arabic. |
| `vocab.txt` | **The only allowed `image` values**: 897 keys, each with `topic | group | source subject` describing what the cover depicts. |
| `calibration.md` | Grade 12, authored by hand. Match this judgement and this level of variety. |

## What to choose per chapter

1. **`image`** — one key copied **verbatim** from `vocab.txt`. Never build, shorten or guess a key:
   a topic exists under ONE level prefix only, so `high-fractions-cover.jpg` may not exist even though
   `elementary-fractions-cover.jpg` does. If the string is not in `vocab.txt`, it is wrong.
2. **`concept`** — exactly one of:
   `art` `life` `career` `celebration` `chemistry` `civic` `computer` `earth` `economy` `english`
   `geography` `health` `history` `language` `skills` `math` `nature` `sport` `physics` `mind`
   `faith` `science` `society` `teaching`
   - `life` = biology, the human body, plants and animals as organisms, agriculture · `nature` = habitats,
     ecology, biodiversity · `earth` = geology, weather, space, environment · `science` = general science,
     scientific method, engineering · `language` = Arabic, French, any non-English language and its
     literature · `english` = the English subject · `faith` = Islamic studies, Quran, Christian education ·
     `civic` = national education, citizenship, military science · `economy` = commerce, entrepreneurship,
     resources · `career` = technical / vocational · `skills` = life skills · `computer` = ICT, computing.
   - The concept follows the **chapter's** content, not just the subject: a science chapter on magnets is
     `physics`; a geography chapter on rocks is `earth`.

## Rules

- **Fit first.** Pick the cover whose topic best matches what the chapter teaches. Arabic-language
  chapters map to their language-arts analogue (grammar → sentences / parts of speech, poetry → poetic
  devices, reading → comprehension, composition → writing), exactly as grade 12 did.
- **Level preference, soft.** Grades 1–5: `elementary-` first. Grades 6–8: `middle-` first. Grades 9–11:
  `high-` first. Cross a level when the right topic exists only elsewhere. Avoid `elementary-` covers for
  grades 9–11 and `high-` covers for grades 1–3 unless nothing else fits.
- **Faith subjects** (`islamic`, `islamic-studies`, `quran`, `christian-education`): concept `faith`, and
  a **neutral thematic** cover — reading and text analysis, recitation / sound, ethics, values, community,
  family, learning, historical inquiry, kindness, responsibility. **Never** a cover whose source subject is
  `Religion`, `Religion and Ethics`, `Religion and Philosophy` or `Celebrations, Commemorations and
  Festivals` for these subjects. The validator rejects it.
- **Faith subjects use a vetted palette — REQUIRED.** Topic names mislead: `literary-contexts` shows a woman in a
  backless dress, the `financial-literacy` covers are piggy banks, `historical-inquiry` shows a ship with a cross on its
  sail, `hygiene` shows germs, `ethical-debates` shows a halo and a devil's tail. For `islamic`, `islamic-studies`,
  `quran` and `christian-education`, every chapter AND lesson image must come from `faith-palette.txt` (covers that
  were actually viewed). The validator enforces it. Good fits: `high-water` / `elementary-keeping-clean-and-healthy`
  for purification, `middle-sound` / `high-sound` for Tajweed, `high-accounting-and-finance` or
  `high-corporate-social-responsibility` for zakat, trade and charity, `elementary-this-month-in-history` /
  `elementary-map-skills` / `middle-topographic-maps` for the Prophet's biography and journeys,
  `high-research-and-ethics-in-sociology` (balance scales) for justice, `middle-literary-texts` /
  `high-language-and-text-analysis-skills` for Quran and Hadith text study.
- **Cultural fit, every subject.** These are Sudanese schools. Do not pick covers about alcohol, dating or
  relationships, Halloween, Christmas, Easter, Valentine's Day, Pride, or other festivals foreign to the
  context. Avoid US-specific civics/history covers (presidents, the Constitution, the American Revolution,
  Thanksgiving, westward expansion) unless the chapter is genuinely about that topic. For Sudanese, Arab
  or Islamic history prefer generic history covers (ancient civilisations, historical inquiry, being a
  historian, empires, trade, maps, colonisation, independence movements).
- **Variety.** Within a subject do not reuse one cover for more than two chapters unless they truly share
  a topic. Grade 12 used 147 distinct covers for 192 chapters — aim for that spread. The validator warns
  on heavy reuse.
- **Lesson overrides are the exception.** Add a lesson `image` only when that lesson's topic clearly
  diverges from its chapter's cover AND a distinct, clearly better cover exists. Expect roughly 10–20 %
  of lessons, often far fewer. Never for generic lessons ("Lesson 3", "الدرس الثالث"). Never equal to the
  chapter image. Lessons without an override inherit the chapter's cover automatically.
- If a topic name is genuinely ambiguous ("sound", "space", "learning") use the `group` and `source
  subject` columns to decide what the cover shows.

## Output — one file per subject, written the moment that subject is finished

`out/g<grade>/<dir>.json` (create the folder), e.g. `out/g5/math.json`:

```json
{
  "grade": 5,
  "dir": "math",
  "chapters": {
    "<chapter slug exactly as in the slice>": {
      "concept": "math",
      "image": "clickview/elementary-fractions-cover.jpg",
      "why": "fractions unit",
      "lessons": {
        "<lesson slug>": { "image": "clickview/elementary-decimals-cover.jpg" }
      }
    }
  }
}
```

`why` is at most eight words. `lessons` is optional. Every chapter of the subject must be present.

After writing each file run the gate and fix every ERROR before moving on:

```bash
python3 SD_AUTH/validate.py SD_AUTH/out/g5/math.json
```

## Constraints

- Write **only** inside `SD_AUTH/out/`. Do not modify anything under `/Users/abdout/hogwarts`.
- Do not fetch anything from the web. Do not call the `advisor` tool. Do not spawn sub-agents.
- Work subject by subject and write each file as you go — if you are interrupted, finished files survive.
- Finish with a short summary: subjects done, chapters, lesson overrides, distinct covers used, and any
  chapter where nothing in the vocabulary fit well (name the chapter and what you settled for).
