NAME=python
AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPENDENCIES=
COMPILED=false
VERSIONS=2.7.1 3.5.1 3.9.1

include common.mk


${RUN_FILE}:
	echo 'python${VERSION_MINOR} $$*' > $@

${ENV_FILE}:
	echo 'export PATH=$$PWD/bin:$$PATH' > $@

${BIN_DIR}: ${BUILD_DIR}Python-${VERSION}/
	$(eval TMP_DIR=${PWD}/${BUILD_DIR}tmpout/)
	cd $< && ./configure --prefix ${PREFIX}
	$(MAKE) -C $<
	DESTDIR=${TMP_DIR} $(MAKE) -C $< altinstall
	mv ${TMP_DIR}${PREFIX} ${BIN_DIR} && rm -rf ${TMP_DIR}


${BUILD_DIR}Python-${VERSION}.tar.gz: 
	curl "https://www.python.org/ftp/python/${VERSION}/Python-${VERSION}.tgz" -o $@
