"""Rebuild the .bq-* section of thmanyah-clone.css from the committed base,
so re-runs never duplicate it."""
import subprocess

base = subprocess.run(["git", "show", "HEAD:src/styles/thmanyah-clone.css"],
                      capture_output=True, text=True, check=True).stdout
assert "bq-" not in base and "answer-eight-word" not in base

old = """.answer-lottie {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  height: 100vh;
}
"""
assert base.count(old) == 1

css = open(".wordmark/out.css").read().rstrip()
block = old.replace("  height: 100vh;\n}", """  height: 100vh;
  /* #afe4b6 is the Lottie's own "Pale Green Solid 1" layer: the panel's
     ground was painted by the animation, not by the section, so dropping
     the Lottie took the colour with it. It sits on this wrapper rather
     than on the word so the write happens over the ground, not with it. */
  background: #afe4b6;
}""") + '''
/* The word that fills the "8" panel — see
   thmanyah/atom/WordmarkWriting.tsx. The word is an <svg> whose viewBox
   frames it at the reference lockup's share of the panel, so it needs no
   font-size math: "meet" scales it by width on a 16:9 panel and by height on
   a short or portrait one, which is what the reference Lottie's
   "xMidYMid slice" worked out to, minus the cropping.

   Every animation below is transform/opacity only and stays paused until
   .bq-go lands, so nothing runs while the panel is off screen. Timings are
   percentages of one shared 9.64s cycle rather than per-element delays: an
   animation-delay applies once, not per iteration, and would desynchronise
   the whole word after the first loop.

   Generated — do not hand-edit past this point. See scripts/wordmark/. */
.answer-eight-word {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.answer-eight-word .bq {
  width: 100%;
  height: 100%;
  display: block;
}
.bq-r {
  animation-duration: 9.64s;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-play-state: paused;
}
.bq-go .bq-r {
  animation-play-state: running;
}
''' + css + "\n"

open("src/styles/thmanyah-clone.css", "w", encoding="utf-8").write(base.replace(old, block, 1))
print("rebuilt")
