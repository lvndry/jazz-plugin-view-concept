import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { COMMANDS, composeMessage, isViewCommand, stripFrontmatter } from "../src/compose.ts";

const ROOT = resolve(import.meta.dir, "..");
const skillText = (name: string): string => `body of ${name}`;

describe("composeMessage", () => {
  test("hands over only the command's own skill", () => {
    const message = composeMessage({
      command: "build-feature",
      args: ["feat/x"],
      root: "/plugins/vc",
      agentId: "agent-1",
      readSkillText: skillText,
    });
    expect(message).toContain('<skill name="build-feature">\nbody of build-feature\n</skill>');
    expect(message.match(/<skill name=/g)?.length).toBe(1);
    expect(message).toEndWith("Request: feat/x");
  });

  test("points the checkout path the skills expect at the vendored copy", () => {
    const message = composeMessage({
      command: "review-docs",
      args: [],
      root: "/plugins/vc",
      agentId: "agent-1",
      readSkillText: () => "Read `~/Documents/code/view-concept/skills/write-readme/SKILL.md`.",
    });
    expect(message).toContain("Read `/plugins/vc/vendor/skills/write-readme/SKILL.md`.");
  });

  test("page commands name the CLI path and the Jazz agent", () => {
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

  test("terminal commands carry no page instructions", () => {
    const message = composeMessage({
      command: "write-readme",
      args: ["benchmark/"],
      root: "/plugins/vc",
      agentId: "agent-1",
      readSkillText: skillText,
    });
    expect(message).not.toContain("bin/view-concept");
    expect(message).not.toContain("wait_for");
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

test("isViewCommand accepts only the declared commands", () => {
  expect(isViewCommand("build-feature")).toBe(true);
  expect(isViewCommand("view-branch")).toBe(false);
});

test("the manifest declares every command, and each has a vendored skill", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "jazz-plugin.json"), "utf8")) as {
    commands: { name: string }[];
  };
  expect(manifest.commands.map((command) => command.name).sort()).toEqual([...COMMANDS].sort());
  for (const command of COMMANDS) {
    expect(existsSync(join(ROOT, "vendor", "skills", command, "SKILL.md"))).toBe(true);
  }
});
