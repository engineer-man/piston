PACKAGES=$(shell find * -maxdepth 0 -type d)
BUILD_PLATFORM=$(or ${PLATFORM},baremetal-$(shell grep -oP "^ID=\K.+" /etc/os-release))

help:
	@echo "You probably don't want to build all package"
	@echo "If you do run $`make build-all$`"
	@echo 
	@echo "Run $`make [language]-[version].pkg.tar.gz$` to build a specific language"

build build-all: $(addsuffix .pkg.tar.gz, ${PACKAGES})
clean clean-all: $(addprefix clean-, ${PACKAGES})

clean-%: %/
	rm -rf $</build $</output

%.pkg.tar.gz: %/output %/run %/environment %/pkg-info.json
	rm -f $@
	tar czf $@ -C $* $(patsubst $*/%,%,output run environment pkg-info.json $(shell find $*/compile)) --transform='s|output|$*|;s|environment|$*/environment|'

%/pkg-info.json: %/metadata.json
	jq '.build_platform="${BUILD_PLATFORM}"' $< > $@

%/output: %/ %/build.sh
	cd $< && chmod +x ./build.sh && ./build.sh





