NAME=deno
AUTHOR=Thomas Hobson <thomas@hexf.me>
DEPENDENCIES=
COMPILED=false
VERSIONS=1.7.5

include common.mk


${RUN_FILE}:
	echo 'deno run $$*' > $@

${ENV_FILE}:
	echo 'export PATH=$$PWD:$$PATH' > $@

${BIN_DIR}: ${BUILD_DIR}deno-x86_64-unknown-linux-gnu/
	mkdir -p $@
	mv $</deno $@
	chmod +x $@/deno
	
${BUILD_DIR}deno-x86_64-unknown-linux-gnu.zip: 
	curl -L "https://github.com/denoland/deno/releases/download/v${VERSION}/deno-x86_64-unknown-linux-gnu.zip" -o $@
