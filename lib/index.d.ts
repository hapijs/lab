/// <reference types="node" />

/**
 * Creates a test script.
 * 
 * @param options - script creation options.
 * 
 * @returns a script interface.
 */
export function script(options?: script.Options): script.Script;

declare namespace script {

    interface Options {

        /**
         * Determines if execution of tests should be delayed until the CLI runs them explicitly.
         * 
         * @default true
         */
        schedule?: boolean;

        /**
         * 
         */
        cli?: Cli;
    }

    interface Cli {

        /**
         * Specifies an assertion library module path to require and make available under Lab.assertions as well as use for enhanced reporting.
         */
        readonly assert?: string;

        /**
         * Forces the process to exist with a non zero exit code on the first test failure.
         * 
         * @default false
         */
        readonly bail?: boolean;

        /**
         * Enables color output.
         * 
         * @default terminal capabilities.
         */
        readonly colors?: boolean;

        /**
         * Sets a timeout value for before, after, beforeEach, afterEach in milliseconds.
         * 
         * @default 0
         */
        readonly 'context-timeout'?: number;

        /**
         * Enable code coverage analysis
         * 
         * @default false
         */
        readonly coverage?: boolean;

        /**
         * Includes all files in coveragePath in report.
         * 
         * @default false
         */
        readonly 'coverage-all'?: boolean;

        /**
         * Set code coverage excludes (an array of path strings).
         */
        readonly 'coverage-exclude'?: string[];

        /**
         * Prevents recursive inclusion of all files in coveragePath in report.
         * 
         * @default false
         */
        readonly 'coverage-flat'?: boolean;

        /**
         * Enables coverage on external modules.
         */
        readonly 'coverage-module'?: string[];

        /**
         * Sets code coverage path.
         */
        readonly 'coverage-path'?: string;

        /**
         * File pattern to use for locating files for coverage.
         */
        readonly coveragePattern?: RegExp;

        /**
         * Minimum plan threshold to apply to all tests that don't define any plan.
         */
        readonly 'default-plan-threshold'?: number;

        /**
         * Skip all tests (dry run).
         * 
         * @default: false
         */
        readonly dry?: boolean;

        /**
         * Value to set NODE_ENV before tests.
         * 
         * @default: 'test'
         */
        readonly environment?: string;

        /**
         * Number of times to retry failing tests (marked explicitly for retry).
         * 
         * @default 5
         */
        readonly retries?: number;

        /**
         * Prevent recursive collection of tests within the provided path.
         * 
         * @default false
         */
        readonly flat?: boolean;

        /**
         * Sets a list of globals to ignore for the leak detection (comma separated).
         */
        readonly globals?: string[];

        /**
         * Only run tests matching the given pattern which is internally compiled to a RegExp.
         */
        readonly grep?: string;

        /**
         * Range of test ids to execute.
         */
        readonly id?: number[];

        /**
         * Sets lab to start with the node.js native debugger.
         * 
         * @default false
         */
        readonly inspect?: boolean;

        /**
         * Sets global variable leaks detection.
         * 
         * @default true
         */
        readonly leaks?: boolean;

        /**
         * Enables code lint.
         * 
         * @default false
         */
        readonly lint?: boolean;

        /**
         * Linter path.
         * 
         * @default 'eslint'
         */
        readonly linter?: string;

        /**
         * Apply any fixes from the linter.
         * 
         * @default false
         */
        readonly 'lint-fix'?: boolean;

        /**
         * Options to pass to linting program. It must be a string that is JSON.parse(able).
         */
        readonly 'lint-options'?: string;

        /**
         * Linter errors threshold in absolute value.
         * 
         * @default 0
         */
        readonly 'lint-errors-threshold': number;

        /**
         * Linter warnings threshold in absolute value.
         * 
         * @default 0
         */
        readonly 'lint-warnings-threshold': number;

        /**
         * File path to write test results. When set to an array, the array size must match the reporter option array.
         * 
         * @default stdout
         */
        readonly output?: string | string[];

        /**
         * File paths to load tests from.
         * 
         * @default ['test']
         */
        readonly path?: string[];

        /**
         * File pattern to use for locating tests (must include file extensions).
         */
        readonly pattern?: RegExp;

        /**
         * Reporter type. One of: 'console', 'html', 'json', 'tap', 'lcov', 'clover', 'junit'.
         * 
         * @default 'console'
         */
        readonly reporter?: string | string[];

        /**
         * Random number seed when shuffle is enabled.
         */
        readonly seed?: string;

        /**
         * Shuffle script execution order.
         * 
         * @default false
         */
        readonly shuffle: boolean;

        /**
         * Silence skipped tests.
         *
         * @default false
         */
        readonly 'silent-skips'?: boolean;

        /**
         * Enable support for sourcemaps.
         *
         * @default false
         */
        readonly sourcemaps?: boolean;

        /**
         * Code coverage threshold percentage.
         */
        readonly threshold?: number;

        /**
         * Timeout for each test in milliseconds.
         * 
         * @default 2000
         */
        readonly timeout?: number;

        /**
         * Transformers for non-js file types.
         */
        readonly transform?: Transformer[];

        /**
         * Test types definitions.
         *
         * @default false
         */
        readonly types?: boolean;

        /**
         * Location of types definitions test file.
         */
        readonly 'types-test'?: string;

        /**
        * Sets output verbosity (0: none, 1: normal, 2: verbose).
        *
        * @default 1
        */
        readonly progress?: number;
    }

    interface Transformer {

        readonly ext: string;

        transform(content: string, filename: string): string;
    }

    interface Script {
        after: Setup;
        afterEach: Setup;
        before: Setup;
        beforeEach: Setup;

        describe: Experiment;
        experiment: Experiment;
        suite: Experiment;

        it: Test;
        test: Test;
    }

    interface Setup {

        (action: Action): void;
        (options: TestOptions, action: Action): void;
    }

    interface Experiment {

        (title: string, content: () => void): void;
        (title: string, options: Omit<TestOptions, 'plan'>, content: () => void): void;

        only(title: string, content: () => void): void;
        only(title: string, options: Omit<TestOptions, 'plan'>, content: () => void): void;

        skip(title: string, content: () => void): void;
        skip(title: string, options: Omit<TestOptions, 'plan'>, content: () => void): void;
    }

    interface Test {

        (title: string, test: Action): void;
        (title: string, options: TestOptions, test: Action): void;

        only(title: string, test: Action): void;
        only(title: string, options: TestOptions, test: Action): void;

        skip(title: string, test: Action): void;
        skip(title: string, options: TestOptions, test: Action): void;
    }

    interface Action {

        <T>(flags: Flags): Promise<T> | void;
        (flags: Flags): void;
    }

    interface TestOptions {

        /**
         * Sets the entire experiment content to be skipped during execution.
         * 
         * @default false
         */
        readonly skip?: boolean;

        /**
         * Sets all other experiments to skip.
         * 
         * @default false
         */
        readonly only?: boolean;

        /**
         * Overrides the default test timeout for tests and other timed operations in milliseconds.
         * 
         * @default 2000
         */
        readonly timeout?: number;

        /**
         * The expected number of assertions the test must execute.
         */
        readonly plan?: number;

        /**
         * Set the test to be retried a few times when it fails. Can be set to true to used the default number of retries or an exact number of maximum retries.
         *
         * @default false
         */
        readonly retry?: number | boolean;
    }

    interface Flags {

        /**
         * An object that is passed to `before` and `after` functions in addition to tests themselves.
         */
        readonly context: Record<string, any>;

        /**
         * Sets a requirement that a function must be called a certain number of times.
         * 
         * @param func - the function to be called.
         * @param count - the number of required invocations.
         * 
         * @returns a wrapped function.
         */
        mustCall<T extends (...args: any[]) => any>(func: T, count: number): T;

        /**
         * Adds notes to the test log.
         * 
         * @param note - a string to be included in the console reporter at the end of the output.
         */
        note(note: string): void;

        /**
         * A property that can be assigned a cleanup function registered at runtime to be executed after the test completes.
         */
        onCleanup?: Action;

        /**
         * A property that can be assigned an override for global exception handling.
         */
        onUncaughtException?: ErrorHandler;

        /**
         * A property that can be assigned an override function for global rejection handling.
         */
        onUnhandledRejection?: ErrorHandler;
    }

    interface ErrorHandler {

        (err: Error): void;
    }
}


export const types: types.Types;

declare namespace types {

    interface Types {
        expect: Expect;
    }

    interface Expect {

        /**
         * Assert the type of the value expected
         * 
         * @param value - the value being asserted.
         */
        type<T>(value: T): void;

        /**
         * Assert the value to throw an argument error
         * 
         * @param value - the value being asserted.
         */
        error<T = any>(value: T): void;
    }
}
