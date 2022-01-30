#!/usr/bin/env sh

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <language name> [runtime name]"
    echo
    echo "language name: The name of the language to add, e.g. javascript"
    echo "runtime name: The name of the runtime to add, e.g. node"
    echo "  In most cases runtime won't be required, e.g. python3 is both a language and runtime"
    exit 1;
fi

LANGUAGE=$1
RUNTIME=$1
NAME=$1

if [[ $# -eq 2 ]]; then
    RUNTIME=$2
    NAME=$LANGUAGE-$RUNTIME
fi


if grep "./$NAME.nix" default.nix > /dev/null; then
    echo "ERROR: $NAME already exists"
    echo "Remove it from default.nix and retry if this is intended"
    exit 1
else
    sed -i '$d' default.nix
    echo "    \"$NAME\" = import ./$NAME.nix args;" >> default.nix
    sed -e 's/%LANGUAGE%/'"$LANGUAGE"'/g' \
        -e 's/%RUNTIME%/'"$RUNTIME"'/g' \
        .scaffold.nix > $NAME.nix
    git add $NAME.nix
    echo "}" >> default.nix

    echo "Scaffolded $NAME"
    echo "Edit $NAME.nix to get started"
fi