import {
  $,
  ProcessOutput,
  ProcessPromise,
  cd as $cd,
  chalk,
} from "npm:zx@8.0.2";
import { buildCmd } from "npm:zurk@0.1.4/spawn";

export { $, chalk } from "npm:zx@8.0.2";

const delay = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

const printMessage = async (message: string) => {
  for (const c of [...message]) {
    await Deno.stdout.write(new TextEncoder().encode(c));
    await delay(15);
  }
};

const printComment = async (comment: string) => {
  const lines = comment.split("\n");
  for (const line of lines) {
    await printMessage(chalk.green(`# ${line}\n`));
  }
};

const printCommand = async (command: string, autoRun: boolean) => {
  await printMessage(chalk.gray("$ "));
  await printMessage(command);
  if (autoRun) {
    await printMessage("\n");
  }
};

const waitForInput = async () => {
  await Deno.stdin.read(new Uint8Array(1));
};

export interface StepOptions {
  comment?: string;
  autoRun?: boolean;
}

export function step(
  cmd: ShellCommand,
  options?: StepOptions
): Promise<ProcessOutput>;
export function step(cmd: ChdirCommand, options?: StepOptions): Promise<void>;

export async function step(
  cmd: ShellCommand | ChdirCommand,
  { comment, autoRun = false }: StepOptions = {}
): Promise<ProcessOutput | void> {
  if (comment !== undefined) {
    await printComment(comment);
  }
  await printCommand(cmd.command, autoRun);
  if (!autoRun) {
    await waitForInput();
  }

  const output = await cmd.run();

  console.log("");
  return output;
}

interface Command {
  get command(): string;
  run(): ProcessPromise | Promise<void>;
}

// deno-lint-ignore no-explicit-any
type ShellCommandArgs = [pieces: TemplateStringsArray, ...args: any[]];

export class ShellCommand implements Command {
  #args: ShellCommandArgs;

  constructor(args: ShellCommandArgs) {
    this.#args = args;
  }

  public get command(): string {
    const [cmd, ...args] = this.#args;
    return buildCmd($.quote, cmd, args) as string;
  }

  run(): ProcessPromise {
    const [cmd, ...args] = this.#args;
    return $({ stdio: ["inherit", "inherit", "inherit"], nothrow: true })(
      cmd,
      ...args
    );
  }
}

export function sh(...args: ShellCommandArgs): ShellCommand {
  return new ShellCommand(args);
}

export class ChdirCommand implements Command {
  #dir: string;

  constructor(dir: string) {
    this.#dir = dir;
  }

  public get command(): string {
    return `cd ${$.quote(this.#dir)}`;
  }

  async run(): Promise<void> {
    await $cd(this.#dir);
  }
}

export function cd(dir: string): ChdirCommand {
  return new ChdirCommand(dir);
}
