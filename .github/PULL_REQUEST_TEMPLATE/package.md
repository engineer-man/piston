Checklist:

-   [ ] The package builds locally with `./piston build-pkg [package] [version]`
-   [ ] The package installs with `./piston ppman install [package]=[version]`
-   [ ] The package runs the test code with `./piston run [package] -l [version] packages/[package]/[version]/test.*`
-   [ ] Package files are placed in the correct directory
-   [ ] No old package versions are removed
-   [ ] All source files are deleted in the `build.sh` script
-   [ ] `metadata.json`'s `language` and `version` fields match the directory path
-   [ ] Any extensions the language may use are set as aliases
-   [ ] Any alternative names the language is referred to are set as aliases.
