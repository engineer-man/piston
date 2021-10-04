# Contributing packages to the Piston Repository

## Naming Languages

Languages should be named after their interpreters, and the command line binaries you call. The language version should use semantic versioning.
For example, the full name of the standard python interpreter is `CPython`, however we would name it `python`, after the main binary which it provides.
In the example of NodeJS, we would call this `node`, after the main binary.

## Creating new languages

See [deno/1.7.5/](deno/1.7.5/) or any other directory for examples.

1. Create a new branch on your fork of engineer-man/piston

2. Create directories named `[language]/[version]`. See Naming Languages for how to determine the name for your language

3. Create a file named `build.sh`, adding a shebang for bash `#!/bin/bash` on the first line.
In this file put any steps to compile the specified langauge.
This script should download sources, compile sources and output binaries. They should be dumped into the current working directory, removing any files which aren't required in the process.

4. Create a file named `run`, containing bash script to run the interpreter.
The first argument given to this script (`$1`) is the name of the main file, with the remaining ones as program arguments.
STDIN is piped directly into the run file, and as such nothing special is required to deal with STDIN, except leaving it open.

5. Create a file named `compile`, containing bash script to compile sources into binaries. This is only required if the language requires a compling stage.
The first argument is always the main file, followed the names of the other files as additional arguements. If the language does not require a compile stage, don't create a compile file.

6. Create a file named `environment`, containing `export` statements which edit the environment variables accordingly. The `$PWD` variable should be used, and is set inside the package directory when running on the target system.

7. Create a test script starting with test, with the file extension of the language. This script should simply output the phrase `OK`. For example, for mono we would create `test.cs` with the content:
```cs
using System;

public class Test
{
    public static void Main(string[] args)
    {
        Console.WriteLine("OK");
    }
}
```

8. Create a `metadata.json` file which contains metadata about the language and interpreter. This simply contains the language name, as in the folder name, the version as in the folder name, aliases that can be used to call this package, limit overrides (if any) that can be used to override the default constraints and finally a dependencies map.
The dependencies map contains the keys as language names, and the values as semver selectors for packages.
```json
{
    "language": "deno",
    "version": "1.7.5",
    "dependencies": {},
    "aliases": ["deno-ts", "deno-js"]
}
```
If the interpreter/compiler provides multiple languages, then the provides property should be used:
```json
{
    "language": "dotnet",
    "version": "5.0.201",
    "provides": [
        {
            "language": "basic.net",
            "aliases": [
                "basic",
                "visual-basic",
                "visual-basic.net",
                "vb",
                "vb.net",
                "vb-dotnet",
                "dotnet-vb",
                "basic-dotnet",
                "dotnet-basic"
            ],
            "limit_overrides": { "max_process_count": 128 }
        },
        {
            "language": "fsi",
            "aliases": [
                "fsx",
                "fsharp-interactive",
                "f#-interactive",
                "dotnet-fsi",
                "fsi-dotnet",
                "fsi.net"
            ]
        }
    ]
}
```

9. Test your package builds with running `make [language]-[version].pkg.tar.gz`.
If it all goes to plan, you should have a file named `[language]-[version].pkg.tar.gz`, in this case you're good to go, albeit it is preferable to test the package locally as follows
```shell
./piston build-pkg [package] [version]
./piston ppman install [package]=[version]
./piston run [package] -l [version] packages/[package]/[version]/test.*
```

10. Commit your changes, using message format of `pkg([language]-[version]): Added [language] [version]`
Any additional commits regarding this package should start with `pkg([language]-[version]): `

11. Create a pull request (currently to v3 branch), referencing an Issue number (if there is one associated).
