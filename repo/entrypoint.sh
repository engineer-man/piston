cd /piston/packages

for pkg in "$@"
do
    make -j16 $pkg.pkg.tar.gz
done

cd /piston/repo
./mkindex.sh

python3 -m http.server