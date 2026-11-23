export interface FinishMessage {
  title: string;
  subtitle: (workoutName: string) => string;
}

export const FINISH_MESSAGES: FinishMessage[] = [
  {
    title: "Workout complete!",
    subtitle: (name) => `Great job completing ${name}`,
  },
  {
    title: "Nice work!",
    subtitle: (name) => `${name} is in the books.`,
  },
  {
    title: "That's a wrap!",
    subtitle: (name) => `You finished ${name}.`,
  },
  {
    title: "Strong finish!",
    subtitle: (name) => `${name} complete. Time to recover.`,
  },
  {
    title: "Burst complete!",
    subtitle: (name) => `Great job completing ${name}`,
  },
];

let lastIndex = -1;

/** Picks a finish message, never repeating the previous one. */
export function pickFinishMessage(): FinishMessage {
  let index = Math.floor(Math.random() * FINISH_MESSAGES.length);
  if (index === lastIndex) {
    index = (index + 1) % FINISH_MESSAGES.length;
  }
  lastIndex = index;
  return FINISH_MESSAGES[index];
}
