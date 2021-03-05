NAME=javascript-node
AUTHOR=Martin Kos <martinkos007@gmail.com>
DEPENDENCIES=
COMPILED=false
VERSIONS=14.16.0 15.10.0

include common.mk


${RUN_FILE}:
	echo 'node $$*' > $@

${ENV_FILE}:
	echo 'export PATH=$$PWD/bin:$$PATH' > $@

${BIN_DIR}: ${BUILD_DIR}node-${VERSION}-sources/
	mkdir -p $@
	mv $<bin/node $@
	chmod +x $@/node

${BUILD_DIR}node-${VERSION}-sources.tar.xz:
	curl "https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-linux-x64.tar.xz" -o $@
