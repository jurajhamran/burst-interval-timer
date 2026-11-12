import { Coffee, Flame, Hourglass, Wind, type LucideIcon } from "lucide-react";
import type { Phase } from "./engine";

export const PHASE_ICONS: Record<Phase["type"], LucideIcon> = {
  work: Flame,
  rest: Wind,
  "round-rest": Coffee,
  prepare: Hourglass,
};
