cd /piston/packages

SERVER=1
BUILD=1

ls -la /piston /piston/*

echo "Running through arguments.."

for pkg in "$@"
do
    shift
    if [[ "$pkg" = "--no-server" ]]; then
        echo "Not starting index server after builds"
        SERVER=0
    elif [[ "$pkg" = "--no-build" ]]; then
        echo "Building no more package"
        BUILD=0
    elif [[ "$pkg" = "--ci" ]]; then
        echo "Running in CI mode, --no-build, --no-server"
        BUILD=0
        SERVER=0
        PACKAGES=$(git diff-tree --no-commit-id --name-only -r $1 | awk -F/ '{ print $2 "-" $3 }' | sort -u)
        echo "Building packages: $PACKAGES"
        for package in "$PACKAGES"; do
            make -j16 $package.pkg.tar.gz
        done

    else
        if [[ $BUILD -eq 1 ]]; then
            echo "Building package $pkg"
            make -j16 $pkg.pkg.tar.gz
            echo "Done with package $pkg"
        else
            echo "Building was disabled, skipping $pkg"
        fi
    fi
done

cd /piston/repo
echo "Creating index"
./mkindex.sh
echo "Index created"

if [[ $SERVER -eq 1 ]]; then
    echo "Starting index server.."
    python3 -m http.server
else
    echo "Skipping starting index server"
fi
exit 0