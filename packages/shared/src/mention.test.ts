import { describe, expect, it } from "vitest";
import { parseMentions } from "./mention";

describe("parseMentions", () => {
  it("finds email mentions", () => {
    const mentions = parseMentions("hi @a.b+test@example.com please review");
    expect(mentions.map((m) => m.identifier)).toEqual(["a.b+test@example.com"]);
  });

  it("finds username mentions", () => {
    const mentions = parseMentions("ping @alex and @sam_1");
    expect(mentions.map((m) => m.identifier)).toEqual(["alex", "sam_1"]);
  });

  it("does not match inside words", () => {
    const mentions = parseMentions("emailme@nope.com and foo@bar are not mentions");
    expect(mentions).toHaveLength(0);
  });
});

