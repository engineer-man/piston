export interface Metadata {
    language: string;
    version: string;
    tooling?: string[];
    aliases?: string[];
    dependencies?: Record<string, string>;
    provides: {
        language: string;
        aliases: string[];
        limit_overrides: Limits;
    }[];
    limit_overrides?: Limits;
}

export type Limit =
    | 'compile_timeout'
    | 'compile_memory_limit'
    | 'max_process_count'
    | 'max_open_files'
    | 'max_file_size'
    | 'output_max_size'
    | 'run_memory_limit'
    | 'run_timeout';

export type Limits = Record<Limit, number>;

export type LimitObject = { compile: number; run: number; };

export type LanguageMetadata = {
    language: string;
    version: string;
};

export type PackageInfo = Metadata & { build_platform: string };

export type File = {
    content: string;
    name?: string;
    encoding?: 'base64' | 'hex' | 'utf8';
};
export type RequestBody = {
    language: string;
    tool?: string;
    version: string;
    files: Array<File>;
    stdin?: string;
    args?: Array<string>;
} & Partial<Limits>;

export interface ResponseBody {
    language: string;
    version: string;
    run: {
        stdout: string;
        stderr: string;
        output: string;
        code: number;
        signal?: NodeJS.Signals;
    };
}

export type ObjectType<
    TObject extends Record<any, Record<Key, any>>,
    Key extends string
> = {
    [K in keyof TObject]: TObject[K][Key];
};
