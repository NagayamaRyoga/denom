import { $, ProcessOutput, ProcessPromise, cd, chalk } from "npm:zx@8.0.2";
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
    await delay(20);
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

export interface Step {
  (cmd: Command, options?: StepOptions): Promise<ProcessOutput>;
  cd: (dir: string, options?: StepOptions) => Promise<void>;
}

export const step: Step = async (cmd, { comment, autoRun = false } = {}) => {
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
};

step.cd = async (dir, { comment, autoRun = false } = {}) => {
  if (comment !== undefined) {
    await printComment(comment);
  }
  await printCommand(`cd ${$.quote(dir)}`, autoRun);
  if (!autoRun) {
    await waitForInput();
  }

  cd(dir);

  console.log("");
};

export interface CommandBuilder {
  (...args: CommandArgs): Command;
}

// deno-lint-ignore no-explicit-any
type CommandArgs = [pieces: TemplateStringsArray, ...args: any[]];

export class Command {
  #args: CommandArgs;

  constructor(args: CommandArgs) {
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

export const sh: CommandBuilder = (...args) => {
  return new Command(args);
};
