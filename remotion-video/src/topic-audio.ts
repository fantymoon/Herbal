// The level the music bed sits at under the narration.
//
// This lives in its own module because two things need it and they must not disagree:
// `topic-film.tsx` applies it, and `npm run topic:verify` asserts the result. A number typed
// into both places is the kind of thing that drifts silently — changing the render would
// leave the gate confidently checking against a level the film no longer has.
//
// Why 0.04 is a measured number and not a taste:
//
//   yuzhou-changwan.mp3    RMS -16.9 dBFS   peak  0.0 dBFS   LRA 15.9 LU
//   narration (17 segments) RMS -24.3 dBFS   speech-only (gated -45 dB) -22.9 dBFS
//
// The track is mastered 7.4 dB hotter than the voice *before* any gain is applied, and its
// 15.9 LU of dynamics means the loud passages sit far above its own average. At the value
// this line started with, 0.12, the bed's loudest moment landed at -18.4 dBFS — 4.5 dB
// *above* the level the voice actually speaks at. That is what "喧宾夺主" is: it is not
// that the bed is loud on average, it is that its peaks cross the voice.
//
// At 0.04 the bed's peaks land at -28.0 dBFS, 5.1 dB under the speaking voice, and its
// average sits 21.9 dB under it. That is where a documentary bed lives.

export const BED_GAIN = 0.04;

/** How far the bed's loudest moment must stay below the voice's speaking level. */
export const BED_HEADROOM_MIN_DB = 4;

/**
 * And how far below it may go before the bed stops being audible at all. A bed nobody can
 * hear is a different defect from a bed nobody can hear over, and drifting into it by
 * "turning it down until it stops bothering me" is easy.
 */
export const BED_HEADROOM_MAX_DB = 25;
