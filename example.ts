import { cd, sh, step } from "./main.ts";

await step(sh`echo Hello, denom`, {
  comment: "Print a message",
});

await step(cd(".."), {
  comment: "Move to the parent directory",
});

await step(sh`pwd`, {
  comment: "Print the current directory",
});
