import confetti from "canvas-confetti";

const PINK = ["#EC4899", "#DB2777", "#A855F7", "#F472B6"];

/** Full-screen pink/purple burst — for big wins (new client, MRR record). */
export function fireConfetti() {
  if (typeof window === "undefined") return;
  const end = Date.now() + 800;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0 },
      colors: PINK,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1 },
      colors: PINK,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Localized small burst — for inline events (deal moved to won). */
export function fireConfettiAt(x: number, y: number) {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 60,
    spread: 55,
    startVelocity: 35,
    origin: { x, y },
    colors: PINK,
  });
}
