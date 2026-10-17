// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

let ctx: AudioContext | null = null

/**
 * A short two-note chime, synthesised — no audio file to load. Quiet on
 * purpose: it sits under a teacher's voice. Silently does nothing where the
 * browser has no Web Audio or has not had a user gesture yet.
 */
export function chime(kind: "hand" | "done" = "hand") {
  if (typeof window === "undefined") return
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    if (ctx.state === "suspended") void ctx.resume()
    const notes = kind === "hand" ? [880, 1175] : [1047, 784, 1047]
    const t0 = ctx.currentTime
    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const start = t0 + i * 0.14
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(start)
      osc.stop(start + 0.4)
    })
  } catch {
    // A chime is never worth an error.
  }
}
