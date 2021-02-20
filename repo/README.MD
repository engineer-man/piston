# Piston Filesystem Repo Builder

This is just a simple POC for a repository tool to run locally.

This only demonstrates building an unsigned python-3.9.1 package, however if it finds an `asc` file it will include it as the signature.

Mount this whole directory into `/repo` in your API container if you wish to use it.