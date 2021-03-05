cd /packages

for pkg in "$@"
do
    make -j16 $pkg.pkg.tar.gz
done

cd /repo
./mkindex.sh

curl -s http://piston_api:6969/repos -XPOST -d "slug=local&url=file:///repo/index.yaml" || echo "WARNING: Could not add repository"
