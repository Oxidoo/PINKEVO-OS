import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "pinkevo-os",
  // Event/signing keys are picked up from process.env automatically.
});
