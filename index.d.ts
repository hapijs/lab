declare module 'lab' {
    export function script(options?: ScriptOptions): Script;

    interface Script {
        after: BeforeAfter,
        afterEach: BeforeAfter,
        before: BeforeAfter,
        beforeEach: BeforeAfter
        describe: Experiment,
        experiment: Experiment,
        suite: Experiment,
        it: Test,
        test: Test,
        expect(value: any): Expect
    }

    type Done = (err?: Error) => void;
    type Callback = (done: Done) => void;
    type Cleanup = (next: Function) => void;

    interface Options {
        timeout: number
    }

    interface BeforeAfter {
        (test: Callback): void,
        (options: Options, test: Callback): void
    }

    interface ScriptOptions extends Options {
        schedule: boolean
    }

    interface ExperimentOptions extends Options {
        parallel: boolean,
        skip: boolean,
        only: boolean
    }

    interface ExperimentOptionsOnlySkip extends Options {
        parallel: boolean
    }

    interface TestOptions extends ExperimentOptions {
        plan: number
    }

    interface TestOptionsOnlySkip extends Options {
        parallel: boolean,
        plan: number
    }

    interface TestFunction {
        (done: Done),
        (done: Done, onCleanup: Cleanup)
    }

    interface Test {
        (title: String, test: TestFunction): void,
        (title: String, options: TestOptions, test: TestFunction): void,
        only(title: String, test: TestFunction): void,
        only(title: String, options: TestOptionsOnlySkip, test: TestFunction): void,
        skip(title: String, test: TestFunction): void,
        skip(title: String, options: TestOptionsOnlySkip, test: TestFunction): void
    }

    interface Experiment {
        (title: String, tests: Function): void,
        (title: String, options: ExperimentOptions, tests: Function): void,
        only(title: String, tests: Function): void,
        only(title: String, options: ExperimentOptionsOnlySkip, tests: Function): void,
        skip(title: String, tests: Function): void,
        skip(title: String, options: ExperimentOptionsOnlySkip, tests: Function): void
    }

    interface Expect {
        a: Expect,
        an: Expect,
        and: Expect,
        at: Expect,
        be: Expect,
        have: Expect,
        in: Expect,
        to: Expect,
        not: Expect,
        once: Expect,
        part: Expect,
        shallow: Expect,
        arguments(): void,
        array(): void,
        boolean(): void,
        buffer(): void,
        date(): void,
        error(type?: Error, message?: String): void,
        function(): void,
        number(): void,
        regexp(): void,
        string(): void,
        object(): void,
        true(): void,
        false(): void,
        null(): void,
        undefined(): void,
        NaN(): void,
        include(values: any): void,
        startWith(value: String): void,
        endWith(value: String): void,
        exist(): void,
        empty(): void,
        length(size: Number): void,
        equal(value: any, options?: any): void,
        above(value: Number): void,
        least(value: Number): void,
        below(value: Number): void,
        most(value: Number): void,
        within(from: Number, to: Number): void,
        between(from: Number, to: Number): void,
        about(value: Number, delta: Number): void,
        instanceof(type: any): void,
        match(regex: RegExp): void,
        satisfy(validator: Function): void,
        throw(type?: Error, message?: String): void,
        fail(message: String): void,
        count(): Number,
        incomplete(): Array<String>,
        thrownAt(error?: Error): String
    }
}

