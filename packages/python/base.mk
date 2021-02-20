AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPS=
COMPILED=false

include ../../common.mk

run:
	echo 'python$(shell grep -oP "\d+.\d+"<<<${VERSION}) $$*' > run

${NAME}-${VERSION}/environment:
	echo 'export PATH=$$PWD/${NAME}-${VERSION}/bin:$$PATH' > $@

${NAME}-${VERSION}/: Python-${VERSION}/
	cd $< && ./configure --prefix /
	$(MAKE) -j$(or ${MAKE_JOBS},64) -C $<
	DESTDIR=../$@ $(MAKE) -j$(or ${MAKE_JOBS},64) -C $< altinstall || true

${NAME}-${VERSION}.tgz: 
	curl "https://www.python.org/ftp/python/${VERSION}/$@" -o $@