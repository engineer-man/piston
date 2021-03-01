NAME=php
AUTHOR=Martin Kos <martinkos007@gmail.com>
DEPENDENCIES=
COMPILED=false
VERSIONS=7.4.15 8.0.2

include common.mk


${RUN_FILE}:
	echo 'php $$*' > $@

${ENV_FILE}:
	echo 'export PATH=$$PWD/bin:$$PATH' > $@

${BIN_DIR}: ${BUILD_DIR}php-${VERSION}-sources/
	$(eval TMP_DIR=${PWD}/${BUILD_DIR}tmpout)
	cd $< && ./configure --prefix ${PREFIX}
	$(MAKE) -C $<
	INSTALL_ROOT=${TMP_DIR}/ $(MAKE) -C $< install
	mv ${TMP_DIR}${PREFIX} ${BIN_DIR} && rm -r ${TMP_DIR}

${BUILD_DIR}php-${VERSION}-sources.tar.gz:
	curl "https://www.php.net/distributions/php-${VERSION}.tar.gz" -o $@
