echo "schema: ppman-repo-1" > index.yaml
echo "baseurl: file://$PWD" >> index.yaml
echo "keys: []" >> index.yaml
echo "packages: []" >> index.yaml

yq -yi '.keys[0] = "0x107DA02C7AE97B084746564B9F1FD9D87950DB6F"' index.yaml

i=-1

for pkg in $(find ../packages -type f -name "*.pkg.tar.gz")
do
    ((i=i+1))
    cp $pkg .
    PKGFILE=$(basename $pkg)
    PKGFILENAME=$(echo $PKGFILE | sed 's/\.pkg\.tar\.gz//g')
    PKGNAME=$(echo $PKGFILENAME | grep -oP '^\K.+(?=-)')
    PKGVERSION=$(echo $PKGFILENAME | grep -oP '^.+-\K.+')
    BUILDFILE=https://github.com/engineer-man/piston/tree/v3/packages/python/
    SIZE=$(tar tzvf $PKGFILE | sed 's/ \+/ /g' | cut -f3 -d' ' | sed '2,$s/^/+ /' | paste -sd' ' | bc)

    tar xzf $PKGFILE pkg-info.json

    yq -yi ".packages[$i] = {} | .packages[$i].signature = \"$(cat ${pkg}.asc)\" | .packages[$i].buildfile = \"$BUILDFILE\" | .packages[$i].size = $SIZE | .packages[$i].download = \"$PKGFILE\" | .packages[$i].dependencies = $(jq .dependencies -r pkg-info.json) | .packages[$i].author = $(jq .author pkg-info.json) | .packages[$i].language =\"$PKGNAME\" | .packages[$i].version = \"$PKGVERSION\" | .packages[$i].checksums = {} | .packages[$i].checksums.sha256 = \"$(sha256sum $PKGFILE | awk '{print $1}')\"" index.yaml
    
    rm pkg-info.json
done