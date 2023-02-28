export type File = {
    content: string;
    name?: string;
    encoding?: 'base64' | 'hex' | 'utf8';
};
export interface Body {
    language: string;
    version: string;
    files: Array<File>;
    stdin?: string;
    args?: Array<string>;
    run_timeout?: number;
    compile_timeout?: number;
    compile_memory_limit?: number;
    run_memory_limit?: number;
}


export type ObjectType<TObject extends Record<any, Record<Key, any>>, Key extends string> = {
    [K in keyof TObject]: TObject[K][Key];
};
