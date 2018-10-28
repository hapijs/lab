export function script(options?: ScriptOptions): Script;

export const assertions: any;

interface Script {
  after: After;
  afterEach: After;
  before: Before;
  beforeEach: Before;
  describe: Experiment;
  experiment: Experiment;
  suite: Experiment;
  it: Test;
  test: Test;
  expect(value: any): any;
}

interface Options {
  /** number of ms to wait for test/experiment to execute */
  timeout?: number;
}

interface Plan {
  /** number of assertions expected to execute */
  plan?: number;
}

interface OperationFlags {
  context: Record<string, any>;
}

interface Operation {
  <T>(flags: OperationFlags): Promise<T> | void;
  (flags: OperationFlags): void;
}

interface Flags extends OperationFlags {
  note(note: string): void;
  onCleanup(operation: Operation): void;
  onUnhandledRejection(err: Error): void;
  onUncaughtException(err: Error): void;
}

interface After {
  (operation: Operation): void;
  (options: Options, operation: Operation): void;
}

interface Before extends After {}

interface ScriptOptions {
  /** should execution of tests be delayed until the CLI runs them */
  schedule?: boolean;
  cli?: any;
}

interface ExperimentOptions extends Options {
  /** skip this experiment */
  skip?: boolean;
  /** only run this experiment/test */
  only?: boolean;
}

interface TestOptionsOnlySkip extends Options, Plan {}

interface TestOptions extends ExperimentOptions, Plan {}

interface TestFunction {
  <T>(flags: Flags): Promise<T> | void;
  (flags: Flags): void;
}

interface Test {
  (title: String, test: TestFunction): void;
  (title: String, options: TestOptions, test: TestFunction): void;
  /** only execute this test */
  only(title: String, test: TestFunction): void;
  only(title: String, options: TestOptionsOnlySkip, test: TestFunction): void;
  /** skip this test */
  skip(title: String, test: TestFunction): void;
  skip(title: String, options: TestOptionsOnlySkip, test: TestFunction): void;
}

interface ExperimentFunction {
  (title: String, experiment: () => void): void;
  (title: String, options: ExperimentOptions, experiment: () => void): void;
}

interface Experiment extends ExperimentFunction {
  /** only execute this experiment */
  only: ExperimentFunction;
  /** skip this experiment */
  skip: ExperimentFunction;
}
