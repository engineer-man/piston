#!/usr/bin/env bash

set -e

curl -LO "https://github.com/SalamLang/Salam/releases/download/v0.4.3/salam-0.4.3-linux-x86_64.tar.gz"
mkdir salam
tar -xzf salam-0.4.3-linux-x86_64.tar.gz -C salam --strip-components=1
rm salam-0.4.3-linux-x86_64.tar.gz

# Salam's binary needs glibc >= 2.38, newer than this image's, so we bundle a
# newer glibc, libgcc and libtinfo and run it through their loader directly.
# Versions pinned via snapshot.debian.org for reproducibility.
mkdir glibc
cd glibc
curl -LO "https://snapshot.debian.org/archive/debian/20260711T202405Z/pool/main/g/glibc/libc6_2.41-12+deb13u4_amd64.deb"
echo "967aa62605721081c3eb2a17650611a792aa802d76a6511d1840242623d204c9  libc6_2.41-12+deb13u4_amd64.deb" | sha256sum -c -
curl -LO "https://snapshot.debian.org/archive/debian/20250315T204837Z/pool/main/g/gcc-14/libgcc-s1_14.2.0-19_amd64.deb"
echo "3c71917b490d1a17aed43196a2787a256ecf060526cdb20216a74bedc061b150  libgcc-s1_14.2.0-19_amd64.deb" | sha256sum -c -
curl -LO "https://snapshot.debian.org/archive/debian/20250306T211336Z/pool/main/n/ncurses/libtinfo6_6.5+20250216-2_amd64.deb"
echo "8b9f6a7983e9418564e48a627518de4c03917b56efe68d7f3e93bd8fffa1cc10  libtinfo6_6.5+20250216-2_amd64.deb" | sha256sum -c -
for pkg in *.deb; do
    ar x "$pkg" data.tar.xz
    tar -xJf data.tar.xz --strip-components=4 --wildcards "./usr/lib/x86_64-linux-gnu/*.so*"
    rm -f data.tar.xz control.tar.xz debian-binary "$pkg"
done
cd ..
