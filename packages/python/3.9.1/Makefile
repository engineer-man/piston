NAME=python
VERSION=3.9.1
AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPS=
COMPILED=false

MAKE_JOBS=64

include ../../Makefile

run:
	echo "python3.9 $*" > run

python-${VERSION}/environment:
	echo 'export PATH=$$PWD/python-${VERSION}/bin:$$PATH' > $@

python-${VERSION}/: Python-${VERSION}/
	cd $< && ./configure --prefix /
	make -j${MAKE_JOBS} -C $<
	DESTDIR=../$@ make -j${MAKE_JOBS} -C $< altinstall || true

Python-${VERSION}.tgz: 
	curl "https://www.python.org/ftp/python/${VERSION}/$@" -o $@

%/: %.tgz
	tar xzvf $<


