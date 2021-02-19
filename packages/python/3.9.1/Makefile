NAME=python
VERSION=3.9.1
AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPS=
BINARY_FILES=out/ run

MAKE_JOBS=64

include ../../Makefile

run:
	echo "bin/python3.9 $*" > run

out/: Python-${VERSION}/
	cd $< && ./configure --prefix /
	make -j${MAKE_JOBS} -C $<
	DESTDIR=../out make -j${MAKE_JOBS} -C $< altinstall

Python-${VERSION}.tgz: 
	curl "https://www.python.org/ftp/python/${VERSION}/Python-${VERSION}.tgz" -o $@

%/: %.tgz
	tar xzvf $<


