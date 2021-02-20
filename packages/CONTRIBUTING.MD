# Contributing packages to the Piston Repository

## Creating new languages

1. Create a new branch on your fork of engineer-man/piston.
2. Create a directory (all lowercase) with the name of the language.
3. Create a Makefile containing the following, filling in the fields marked with %
Versions can be a list of version numbers, separated by spaces.
Quotes are not required.
```makefile
LANGUAGE=%
VERSIONS=%

include ../secondary.mk
```
4. Create a `base.mk` file, this is the file which will hold the correct targets to make each build.
It should download any sources it requires uring `curl` and use as much version templating as possible.
You should include 3 variables: `AUTHOR`, `DEPS` and `COMPILED`.

`AUTHOR` is simply your name, and email address formatted as `Your Name <your@email>`.
`DEPS` is a list (separated by spaces) of packages which are required with this one for it to work correctly.
This is mainly used in the case of golfing languages, which use other languages (e.g. python and eilxar) to interpret them. Give a package name and a SemVer selector (e.g. `python==3.x.x` for any python3 build).
`COMPILED` is simply a true or false field indicating if the package contains a `compile` target (see below).

You should also include 3/4 targets: `run`, `${NAME}-${VERSION}`, `${NAME}-${VERSION}/environment` and optionally `compile` (only if the language is a compiled language, e.g. cpp/c)

The `run` file is one which is passed the main source file (first argument) and the arguments for the process (remaining arguments). STDIN data is also piped in. Generate this by using either a `cat` or an `echo` statement(s) and piping them into `$@` (it means the target name in Makefiles). You have to escape `$` symbols with `$$`.

The `${NAME}-${VERSION}` directory should contain all the binaries required to run the language.
You should use this target to compile all the sources, and installing them into the `$@` location

`${NAME}-${VERSION}/environment` should contain a bunch of environment variables which will be passed into the `run` and `compile` scripts of not only this language, but any which depend on it.
If your package depends on any others, their environment variables are automatically sourced, then your packages ones are sourced after.

The `compile` file contains instructions to compile source files into a final binary which should be run by `run`. It's first argument is the main source file, with other source files being provided as other arguments. STDIN is left blank, but both STDOUT and STDERR are returned. The `run` file will be skipped if this file returns a non-zero error code.

5. Commit your new package with the following message format: `pkg([language name] [version(s)]): [description including versions]`

Examples:
* `pkg(python 3.9.1): new version`
* `pkg(python 3.9.1 2.7.1): refactor`