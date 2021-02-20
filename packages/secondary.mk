.PHONY: build sign cleanup clean
build: $(patsubst %,%/${LANGUAGE}-%.pkg.tar.gz,${VERSIONS})
sign: $(patsubst %,%/${LANGUAGE}-%.pkg.tar.gz.asc,${VERSIONS})
clean:
	rm -rf ${VERSIONS}
cleanup: $(patsubst %,%/cleanup,${VERSIONS})
	

%/cleanup: %/Makefile
	$(MAKE) -C $(shell dirname $<) cleanup
	rm $(shell dirname $<)/Makefile

%/${LANGUAGE}-%.pkg.tar.gz.asc: %/Makefile
	$(MAKE) -C $(shell dirname $<) sign
%/${LANGUAGE}-%.pkg.tar.gz: %/Makefile
	$(MAKE) -C $(shell dirname $<)


%/Makefile: 
	@mkdir -p $(shell dirname $@)
	@echo 'VERSION=$(patsubst %/Makefile,%,$@)' > $@
	@echo 'NAME=${LANGUAGE}' >> $@
	@echo 'include ../base.mk' >> $@
