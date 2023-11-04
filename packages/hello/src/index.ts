import { BaseHello } from "./hello";

export class Hello extends BaseHello {
  constructor(name: string) {
    super(name, console);
  }
}
