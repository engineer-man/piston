cd /piston/packages

SERVER=1
BUILD=1
CI=0

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
        CI=1
    else
        if [[ $BUILD -eq 1 ]]; then
            echo "Building package $pkg"
            make -j16 $pkg.pkg.tar.gz PLATFORM=docker-debian
            echo "Done with package $pkg"
        elif [[ $CI -eq 1 ]]; then
            echo "Commit SHA: $pkg"

            cd ..
            echo "Changed files:"
            git diff --name-only $pkg^1 $pkg
            PACKAGES=$(git diff --name-only $pkg^1 $pkg | awk -F/ '{ print $2 "-" $3 }' | sort -u)
            cd packages

            echo "Building packages: $PACKAGES"
            for package in "$PACKAGES"; do
                make -j16 $package.pkg.tar.gz PLATFORM=docker-debian
            done

        else
            echo "Building was disabled, skipping $pkg build=$BUILD ci=$CI"
        fi
    fi
done

cd /piston/repo
echo "Creating index"
./mkindex.sh
echo "Index created"

if [[ $SERVER -eq 1 ]]; then
    echo "Starting index server.."
    # We want the child process to replace the shell to handle signals
    exec python3 /serve.py
else
    echo "Skipping starting index server"
fi
exit 0
