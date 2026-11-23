import { describe, expect, it } from "vitest";
import {
  FINISH_MESSAGES,
  pickFinishMessage,
} from "@/features/timer/finishMessages";

describe("pickFinishMessage", () => {
  it("never returns the same message twice in a row", () => {
    let previous = pickFinishMessage();
    for (let i = 0; i < 100; i++) {
      const next = pickFinishMessage();
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it("only returns known messages", () => {
    for (let i = 0; i < 50; i++) {
      expect(FINISH_MESSAGES).toContain(pickFinishMessage());
    }
  });
});
