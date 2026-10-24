import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Commands that open the page and listen for comment batches. */
const PAGE_COMMANDS = ["view-concept", "build-feature", "triage-code", "review-docs"] as const;
/** Commands that answer in the terminal, with no page and no session. */
const TERMINAL_COMMANDS = ["write-readme", "explain-concept"] as const;

export const COMMANDS = [...PAGE_COMMANDS, ...TERMINAL_COMMANDS] as const;
export type ViewCommand = (typeof COMMANDS)[number];

/** Where the skills expect a view-concept checkout; `vendor/` mirrors its layout. */
const CHECKOUT_PATH = "~/Documents/code/view-concept/";

export function isViewCommand(name: string): name is ViewCommand {
  return (COMMANDS as readonly string[]).includes(name);
}

function isPageCommand(command: ViewCommand): boolean {
  return (PAGE_COMMANDS as readonly string[]).includes(command);
}

export function vendorDirectory(root: string): string {
  return join(root, "vendor");
}

export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }
  const end = markdown.indexOf("\n---\n", 4);
  return end === -1 ? markdown : markdown.slice(end + 5).replace(/^\n+/, "");
}

export function readSkill(root: string, name: string): string {
  return stripFrontmatter(
    readFileSync(join(vendorDirectory(root), "skills", name, "SKILL.md"), "utf8"),
  );
}

export interface ComposeInput {
  readonly command: ViewCommand;
  readonly args: readonly string[];
  readonly root: string;
  readonly agentId: string | undefined;
  readonly readSkillText?: (name: string) => string;
}

function pageInstructions(cli: string, identity: string): readonly string[] {
  return [
    `Wherever they say \`view-concept\`, run \`${cli}\` with execute_command (it needs \`uv\`; nothing else is installed).`,
    `- You are a Jazz agent: pass \`--agent jazz --agent-name ${identity}\` to \`new\` and to every \`open\`, so the page's side threads run on you.`,
    `- Ask the user questions with ask_user_question.`,
    `- You have no background monitor, so the comment channel is \`wait\`: start it with the wait_for tool, condition \`${cli} wait <slug> --timeout 30\` (it exits 0 with the batch printed, 3 when none arrived), and re-arm it each time you wake with no batch or after handling one. Without wait_for, call that command with execute_command and \`--timeout 170\` instead.`,
    `- Where the skill says "agents", spawn_subagent if you have it; otherwise make the changes yourself, one file at a time.`,
  ];
}

/**
 * The turn a command hands the agent: how to run the CLI and listen from Jazz (page commands
 * only), where the skill's files are, the skill itself, then the user's request.
 */
export function composeMessage(input: ComposeInput): string {
  const read = input.readSkillText ?? ((name: string) => readSkill(input.root, name));
  const vendor = `${vendorDirectory(input.root)}/`;
  const cli = `sh ${join(input.root, "bin", "view-concept")}`;
  const identity = input.agentId ?? "<your own agent name>";
  const skill = read(input.command).trim().replaceAll(CHECKOUT_PATH, vendor);
  const request = input.args.join(" ").trim();
  return [
    `[/${input.command} on Jazz]`,
    `Run the instructions below. Any file that names \`${CHECKOUT_PATH}\` means \`${vendor}\`; pass that on to every agent you start.`,
    ...(isPageCommand(input.command) ? pageInstructions(cli, identity) : []),
    "",
    `<skill name="${input.command}">\n${skill}\n</skill>`,
    "",
    request.length > 0 ? `Request: ${request}` : "Request: none given, ask the user what to open.",
  ].join("\n");
}
