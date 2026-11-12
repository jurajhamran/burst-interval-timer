export type ItemType = "work" | "rest";

export interface SessionItem {
  id: string;
  type: ItemType;
  label: string;
  duration: number;
}

export interface PrepareConfig {
  enabled: boolean;
  duration: number;
}

export interface RoundRestConfig {
  enabled: boolean;
  duration: number;
}

export const DEFAULT_PREPARE: PrepareConfig = {
  enabled: true,
  duration: 5,
};

export const DEFAULT_ROUND_REST: RoundRestConfig = {
  enabled: false,
  duration: 30,
};

export const DEFAULT_SKIP_LAST_REST = true;

export interface Workout {
  id: string;
  name: string;
  rounds: number;
  items: SessionItem[];
  prepare: PrepareConfig;
  roundRest: RoundRestConfig;
  skipLastRest: boolean;
}
