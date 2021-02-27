# Contributing packages to the Piston Repository

## Naming Lanaguages

Some languages have multiple different wide-spread interpreters (node/deno for example) which need to be accounted for.

If the given language has multiple incompatiable interpreters (e.g. deno/node/v8), these should be named as `[language]-[interpreter]`.
For cases where the language has many compatable interpreters (e.g. gcc/llvm), pick one and name it `[language]`.
For languages with only 1 wide-spread interpreter (e.g. Kotlin), name it `[language]`

## File Naming Rules

Different versions of interpreters require different steps to build, and in this case they should be given 2 different files, but keep the same language name.

Use `[language-name].mk` (see naming languages) for languages with a common build script.
When the build steps become obsolete, create a new file named `[language-name]-[version].mk`, with the first version where the new build steps were required.

## Creating new languages

See [python.mk](python.mk) or any other `.mk` file (except `common.mk`) for an example.

Please note that this is a regular Makefile, with a few extra varibles added by `common.mk`, any additional variables not listed here can be located in there.

1. Create a new branch on your fork of engineer-man/piston

2. Create a new file for your language, following the naming rules as listed above

3. Add `NAME=[language name]` to this file, replacing `[language name]` with the language name all in lowercase, removing any punctuation and numbers (e.g. 05AB1E becomes osabie).

4. Add `AUTHOR=[author]` to this file, replacing `[author]` with your name and email address in the format `Full Name <your@email.address>` (standard git format).

5. Add `DEPENDENCIES=[dependencies list]` to this file, replacing `[dependencies list]` with a list of dependencies, seperated by spaces in the format `[language]==[version]`. If there are none, simply leave this as `DEPENDENCIES=`

6. Add `COMPILED=[true/false]` to this file, set this to true if the language requires the compile stage, and false if it only requires run.

7. Add `VERSIONS=[version list]` to this file, replacing `[version list]` with a list of [SemVer](https://semver.org/) compilant version numbers for the language which this build file can build. This value will be passed in as `${VERSION}` for you to access

8. Add `include common.mk`, to include all the common Makefile rules and variables.

9. Create the target for the run file by adding `${RUN_FILE}:`, followed by steps on new lines, indented by a tab (`\t`) to create a bash script, which is run for every job (`/execute` endpoint) for this language and returns on STDOUT/STDERR the output of the run.
The script is expected to take in the first argument (`$1`) as the main code file, with subsequent arguments being passed in from the execute endpoint.
The script is passed STDIN as specified in the job, and expects output on STDOUT/STDERR. It should also pass through the exit code from the interpreter.
It is recommended to use `echo` statements, redirecting output to `$@` (a special Makefile variable expanding to the target file, in this case RUN_FILE).
Make sure to escape any `$` with `$$`, as `$` will expand make variables.

10. (optional, only use if language requires compliation)
Create the target for the compile file by adding `${COMPILE_FILE}:`, followed by steps on new lines, indented by a tab (`\t`) to create a bash script, which is run for every job (`/execute` endpoint) for this language, if it requires compilation.
This script is expected to take all code files in as arguements, and output binary files. STDERR/STDOUT are captured and passed out, along with error code. The job STDIN and args are not passed in to this script.
This script should compile source code into a binary, and has a seperate time limit from run, and thus should split the stages.
Follow all priciples from step 9, using echo statements and escaping `$`.

11. Create the target for the environment file by adding `${ENV_FILE}:`, followed by steps on new lines, indented by a tab (`\t`) to create a bash script, which modifies environment variables exactly how you would a `.profile` or `.bashrc` file. Note that this file is only run at install time, and thus cannot dynamicly adjust to the arguements passed into it.
The environment file is also appended with all dependencies before being cached.
You should add in the path to any binaries. The current working directory for the script is contained within the `${BIN_DIR}` folder.

12. Create the target for the binaries by adding `${BIN_DIR}:`, followed by steps on new lines, indented by a tab (`\t`) which will download sources, compile and output binaries in to the `${BIN_DIR}` (`$@`)

13. Locally test your Makefile builds with `make build-[language]-[version]`.
If everything went well, you should now have a `[language]-[version].pkg.tar.gz` file sitting in the root.
If not, read through your error logs, and if in doubt ask for help in #emkc-felix-piston in Discord.

