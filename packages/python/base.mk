NAME=python
AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPS=
#VERSION=
COMPILED=false

include ../../common.mk

run:
	echo 'python$(shell grep -oP "\d+.\d+"<<<${VERSION}) $$*' > run

python-${VERSION}/environment:
	echo 'export PATH=$$PWD/${NAME}-${VERSION}/bin:$$PATH' > $@

python-${VERSION}/: Python-${VERSION}/
	cd $< && ./configure --prefix /
	$(MAKE) -j$(or ${MAKE_JOBS},64) -C $<
	DESTDIR=../$@ $(MAKE) -j$(or ${MAKE_JOBS},64) -C $< altinstall || true

Python-${VERSION}.tgz: 
	curl "https://www.python.org/ftp/python/${VERSION}/$@" -o $@