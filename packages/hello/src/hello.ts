interface IHello {
  name: string;
}

export interface IConsole {
  log: (message: string) => void;
}

export class BaseHello implements IHello {
  name: string;
  console: IConsole;

  constructor(name: string, console: IConsole) {
    this.name = name;
    this.console = console;
  }

  getHello() {
    return `Hello ${this.name}`;
  }

  sayHello() {
    this.console.log(this.getHello());
  }
}
