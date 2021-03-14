cd /piston/packages

SERVER=1

for pkg in "$@"
do
    [[ "$pkg" = "--no-server" ]] && SERVER=0 || make -j16 $pkg.pkg.tar.gz
done

cd /piston/repo
./mkindex.sh

[[ $SERVER -eq 1 ]] && python3 -m http.server
exit 0