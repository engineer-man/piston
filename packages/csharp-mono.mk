NAME=csharp-mono
AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPENDENCIES=
COMPILED=true
VERSIONS=6.12.0

include common.mk


VERSION_6.12.0_FULL=6.12.0.122

VERSION_FULL=${VERSION_${VERSION}_FULL}


${RUN_FILE}:
	echo 'CODE=$${1/cs/exe}' > $@
	echo 'shift' >> $@
	echo 'mono $$CODE $$*' >> $@

${COMPILE_FILE}:
	echo 'csc $$*' > $@

${ENV_FILE}:
	echo 'export PATH=$$PWD/bin:$$PATH' > $@

${BIN_DIR}: ${BUILD_DIR}mono-${VERSION_FULL}/
	$(eval TMP_DIR=${PWD}/${BUILD_DIR}tmpout/)
	cd $< && ./configure --prefix ${PREFIX}
	$(MAKE) -j64 -C $<
	DESTDIR=${TMP_DIR} $(MAKE) -C $< install
	mv ${TMP_DIR}${PREFIX} ${BIN_DIR} && rm -r ${TMP_DIR}

${BUILD_DIR}mono-${VERSION_FULL}.tar.xz: 
	curl "https://download.mono-project.com/sources/mono/mono-${VERSION_FULL}.tar.xz" -o $@
