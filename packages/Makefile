LANG_NAME=$(or ${NAME},none)
LANG_VERSION=$(or ${VERSION},0.0.0)
LANG_AUTHOR=$(or ${AUTHOR},HexF <thomas@hexf.me>)
LANG_DEPS=$(or ${DEPS})
LANG_BINARY_FILES=$(or ${BINARY_FILES},)

${LANG_NAME}-${LANG_VERSION}.pkg.tar.gz: pkg-info.json package.squashfs
	tar czvf $@ $?

package.squashfs: ${LANG_BINARY_FILES}
	mksquashfs $? $@	

%.json: %.jq
	jq '$(shell tr '\n' '|' < $<).' <<< "{}" > $@
	
pkg-info.jq:
	echo '.language="${LANG_NAME}"' > pkg-info.jq
	echo '.version="${LANG_VERSION}"' >> pkg-info.jq
	echo '.author="${LANG_AUTHOR}"' >> pkg-info.jq
	echo '.dependencies={}' >> pkg-info.jq
	$(foreach dep, ${LANG_DEPS}, echo '.dependencies.$(word 1,$(subst =, ,${dep}))="$(word 2,$(subst =, ,${dep}))"' >> pkg-info.jq)

.PHONY: clean
clean: 
	rm -rf $(filter-out Makefile, $(wildcard *))
	