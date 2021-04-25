BASEURL=http://repo:8000/

i=0

echo "" > index

for pkg in $(find ../packages -type f -name "*.pkg.tar.gz")
do
    
    cp $pkg .

    PKGFILE=$(basename $pkg)
    PKGFILENAME=$(echo $PKGFILE | sed 's/\.pkg\.tar\.gz//g')

    PKGNAME=$(echo $PKGFILENAME | grep -oP '^\K.+(?=-)')
    PKGVERSION=$(echo $PKGFILENAME | grep -oP '^.+-\K.+')
    PKGCHECKSUM=$(sha256sum $PKGFILE | awk '{print $1}')

    echo "$PKGNAME,$PKGVERSION,$PKGCHECKSUM,$BASEURL$PKGFILE" >> index
    echo "Adding package $PKGNAME-$PKGVERSION"
    
    ((i=i+1))
done