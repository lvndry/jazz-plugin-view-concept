import { readFileSync } from "node:fs";
import { join } from "node:path";

export const COMMANDS = ["view-concept", "view-branch", "view-refactor"] as const;
export type ViewCommand = (typeof COMMANDS)[number];

/** Skills a command's skill tells the agent to read, in the order it reads them. */
const SKILLS_FOR: Record<ViewCommand, readonly string[]> = {
  "view-concept": ["view-concept", "explain-concept"],
  "view-branch": ["view-branch", "view-concept", "explain-concept"],
  "view-refactor": ["view-refactor", "view-concept", "view-branch", "explain-concept"],
};

export function isViewCommand(name: string): name is ViewCommand {
  return (COMMANDS as readonly string[]).includes(name);
}

export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }
  const end = markdown.indexOf("\n---\n", 4);
  return end === -1 ? markdown : markdown.slice(end + 5).replace(/^\n+/, "");
}

export function readSkill(root: string, name: string): string {
  return stripFrontmatter(readFileSync(join(root, "skills", name, "SKILL.md"), "utf8"));
}

export interface ComposeInput {
  readonly command: ViewCommand;
  readonly args: readonly string[];
  readonly root: string;
  readonly agentId: string | undefined;
  readonly readSkillText?: (name: string) => string;
}

/**
 * The turn a `/view-*` command hands the agent: how to run the CLI and listen from Jazz, the
 * skill (and the skills it builds on), then the user's request.
 */
export function composeMessage(input: ComposeInput): string {
  const read = input.readSkillText ?? ((name: string) => readSkill(input.root, name));
  const cli = `sh ${join(input.root, "bin", "view-concept")}`;
  const identity = input.agentId ?? "<your own agent name>";
  const skills = SKILLS_FOR[input.command].map(
    (name) => `<skill name="${name}">\n${read(name).trim()}\n</skill>`,
  );
  const request = input.args.join(" ").trim();
  return [
    `[/${input.command} on Jazz]`,
    `Run the instructions below. Wherever they say \`view-concept\`, run \`${cli}\` with execute_command (it needs \`uv\`; nothing else is installed).`,
    `- You are a Jazz agent: pass \`--agent jazz --agent-name ${identity}\` to \`new\` and to every \`open\`, so the page's side threads run on you.`,
    `- Ask the user questions with ask_user_question.`,
    `- You have no background monitor, so the comment channel is \`wait\`: start it with the wait_for tool, condition \`${cli} wait <slug> --timeout 30\` (it exits 0 with the batch printed, 3 when none arrived), and re-arm it each time you wake with no batch or after handling one. Without wait_for, call that command with execute_command and \`--timeout 170\` instead.`,
    `- Where the skill says "agents", spawn_subagent if you have it; otherwise make the changes yourself, one file at a time.`,
    "",
    ...skills,
    "",
    request.length > 0 ? `Request: ${request}` : "Request: none given, ask the user what to open.",
  ].join("\n");
}
