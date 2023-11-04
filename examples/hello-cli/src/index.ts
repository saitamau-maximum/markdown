import chalk from "chalk";
import { Hello } from "hello";

export const cli = (args: string[]) => {
  args = args.slice(2);
  if (args.length === 0) {
    console.error(chalk.bold(chalk.red("Please provide a name")));
  }

  for (const arg of args) {
    const hello = new Hello(arg);
    console.log(chalk.green(hello.getHello()));
  }
};
