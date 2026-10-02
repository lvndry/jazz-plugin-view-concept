import { describe, expect, test } from "bun:test";

import { composeMessage, isViewCommand, stripFrontmatter } from "../src/compose.ts";

const skillText = (name: string): string => `body of ${name}`;

describe("composeMessage", () => {
  test("view-refactor brings the skills it builds on, in reading order", () => {
    const message = composeMessage({
      command: "view-refactor",
      args: ["src/store"],
      root: "/plugins/vc",
      agentId: "agent-1",
      readSkillText: skillText,
    });
    const order = ["view-refactor", "view-concept", "view-branch", "explain-concept"].map((name) =>
      message.indexOf(`<skill name="${name}">`),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((first, second) => first - second)).toEqual(order);
    expect(message).toEndWith("Request: src/store");
  });

  test("names the CLI path and the Jazz agent", () => {
    const message = composeMessage({
      command: "view-concept",
      args: ["KKT", "conditions"],
      root: "/plugins/vc",
      agentId: "agent-1",
      readSkillText: skillText,
    });
    expect(message).toContain("sh /plugins/vc/bin/view-concept");
    expect(message).toContain("--agent jazz --agent-name agent-1");
    expect(message).toContain("wait <slug> --timeout 30");
    expect(message).toContain("Request: KKT conditions");
  });

  test("falls back to asking when nothing was typed or the agent is unknown", () => {
    const message = composeMessage({
      command: "view-concept",
      args: [],
      root: "/r",
      agentId: undefined,
      readSkillText: skillText,
    });
    expect(message).toContain("--agent-name <your own agent name>");
    expect(message).toContain("ask the user what to open");
  });
});

describe("stripFrontmatter", () => {
  test("drops the YAML block and keeps the body", () => {
    expect(stripFrontmatter("---\nname: x\n---\n\n# Title\ntext")).toBe("# Title\ntext");
    expect(stripFrontmatter("# No frontmatter")).toBe("# No frontmatter");
  });
});

test("isViewCommand accepts only the three commands", () => {
  expect(isViewCommand("view-branch")).toBe(true);
  expect(isViewCommand("help")).toBe(false);
});
