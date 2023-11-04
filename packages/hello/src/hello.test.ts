import { BaseHello } from "./hello";

import type { IConsole } from "./hello";

describe("Hello", () => {
  const mockConsoleLog = vi.fn();
  const mockConsole = {
    log: mockConsoleLog,
  } satisfies IConsole;

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  it("should say hello", () => {
    const hello = new BaseHello("World", mockConsole);

    hello.sayHello();

    expect(mockConsoleLog).toHaveBeenCalledWith("Hello World");
  });
});
