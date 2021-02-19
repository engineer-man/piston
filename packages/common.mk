LANG_NAME=$(or ${NAME},none)
LANG_VERSION=$(or ${VERSION},0.0.0)
LANG_AUTHOR=$(or ${AUTHOR},HexF <thomas@hexf.me>)
LANG_DEPS=$(or ${DEPS})
LANG_COMPILED=$(or ${COMPILED}, false)

LANG_PKG_TARGETS=pkg-info.json ${LANG_NAME}-${LANG_VERSION}/ ${LANG_NAME}-${LANG_VERSION}/environment run

BUILD_PLATFORM=$(or ${PLATFORM}, baremetal-$(shell grep -oP "^ID=\K\w+" /etc/os-release ))

ifeq (${LANG_COMPILED}, true)
${LANG_NAME}-${LANG_VERSION}.pkg.tar.gz: $(LANG_PKG_TARGETS) compile
endif
${LANG_NAME}-${LANG_VERSION}.pkg.tar.gz: $(LANG_PKG_TARGETS)
	tar czf $@ $?

%.json: %.jq
	jq '$(shell tr '\n' '|' < $<).' <<< "{}" > $@
	
pkg-info.jq:
	echo '.language="${LANG_NAME}"' > pkg-info.jq
	echo '.version="${LANG_VERSION}"' >> pkg-info.jq
	echo '.author="${LANG_AUTHOR}"' >> pkg-info.jq
	echo '.dependencies={}' >> pkg-info.jq
	echo '.build_platform="${BUILD_PLATFORM}"' >> pkg-info.jq
	$(foreach dep, ${LANG_DEPS}, echo '.dependencies.$(word 1,$(subst =, ,${dep}))="$(word 2,$(subst =, ,${dep}))"' >> pkg-info.jq)

%.asc: %
	gpg --detach-sig --armor --output $@ $< 

%/: %.tgz
	tar xzf $<

.PHONY: clean
clean: 
	rm -rf $(filter-out Makefile, $(wildcard *))

,PHONY: cleanup
cleanup:
	rm -rf $(filter-out ${LANG_NAME}-${LANG_VERSION}.pkg.tar.gz.asc, $(filter-out ${LANG_NAME}-${LANG_VERSION}.pkg.tar.gz, $(filter-out Makefile, $(wildcard *))))
	
.PHONY: sign
sign: ${LANG_NAME}-${LANG_VERSION}.pkg.tar.gz.asc