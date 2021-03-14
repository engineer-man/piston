cd /piston/packages

SERVER=1
BUILD=1

echo "Running through arguments.."

for pkg in "$@"
do
    if [[ "$pkg" = "--no-server" ]]; then
        echo "Not starting index server after builds"
        SERVER=0
    elif [[ "$pkg" = "--no-build" ]]; then
        echo "Building no more package"
        BUILD=0
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