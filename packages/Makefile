PACKAGES=$(shell find * -maxdepth 0 -type d)
BUILD_PLATFORM=$(or ${PLATFORM},baremetal-$(shell grep -oP "^ID=\K.+" /etc/os-release))

help:
	@echo "You probably don't want to build all package"
	@echo "If you do run $`make build-all$`"
	@echo 
	@echo "Run $`make [language]-[version].pkg.tar.gz$` to build a specific language"

build build-all: $(addsuffix .pkg.tar.gz, ${PACKAGES})

%.pkg.tar.gz: %/ %/pkg-info.json
	cd $< && chmod +x ./build.sh && ./build.sh
	rm -f $@
	tar czf $@ $* --transform='s|$*||'

%/pkg-info.json: %/metadata.json
	jq '.build_platform="${BUILD_PLATFORM}"' $< > $@




