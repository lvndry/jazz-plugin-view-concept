/**
 * Jazz plugin for view-concept: each command hands the agent the matching skill from this
 * repository's `vendor/skills/` and the path of its `bin/` shim, so the web page works from Jazz
 * with `uv` as the only prerequisite.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { JazzPluginModule, LifecycleEvent } from "@jazz/plugin-sdk";

import { COMMANDS, composeMessage } from "./compose.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const plugin: JazzPluginModule = {
  apiVersion: 1,
  register(api) {
    let agentId: string | undefined;
    const remember = async (event: LifecycleEvent): Promise<void> => {
      if (event.agentId.length > 0) {
        agentId = event.agentId;
      }
    };
    api.lifecycle.register({ event: "session-start", handler: remember });
    api.lifecycle.register({ event: "user-prompt", handler: remember });

    for (const command of COMMANDS) {
      api.commands.register({
        name: command,
        handler: async ({ args }) => {
          try {
            return { message: composeMessage({ command, args, root: ROOT, agentId }) };
          } catch {
            return {
              message: `/${command} cannot find its skill under ${ROOT}/vendor/skills. Tell the user to reinstall the plugin from its source: jazz plugin add lvndry/jazz-plugin-view-concept`,
            };
          }
        },
      });
    }
  },
};

export default plugin;
