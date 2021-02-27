# Wraps all other Makefiles 

# Variables
PKG_FILES=$(filter-out common.mk,$(wildcard *.mk))
PKG_SLUGS=$(foreach pkg, ${PKG_FILES}, $(addprefix $(shell make -f ${pkg} name)-, $(shell make -f ${pkg} versions)))

# Functions
define pkg_info
	$(eval PKG_SLUG=$(patsubst $1-%,%,$2))
	$(eval PKG_PARTS=$(subst -, ,${PKG_SLUG}))
	$(eval PKG_NAME=$(word 1,${PKG_PARTS}))
	$(eval PKG_VERSION=$(word 2,${PKG_PARTS}))
	$(eval PKG_FILE=$(shell grep '^VERSIONS\s*=.*${PKG_VERSION}' $(shell grep "NAME\s*=\s*${PKG_NAME}" ${PKG_FILES} -l) -l))
endef

# Targets

build: $(foreach pkg, ${PKG_FILES}, $(addprefix build-$(shell make -f ${pkg} name)-, $(lastword $(shell make -f ${pkg} versions))))

$(addprefix build-, ${PKG_SLUGS}):
	$(call pkg_info,build,$@)
	$(MAKE) -f ${PKG_FILE} VERSION=${PKG_VERSION} build



clean: $(foreach pkg, ${PKG_FILES}, $(addprefix clean-$(shell make -f ${pkg} name)-, $(shell make -f ${pkg} versions)))
	rm -rf build/
$(addprefix clean-, ${PKG_SLUGS}):
	$(call pkg_info,clean,$@)
	$(MAKE) -f ${PKG_FILE} VERSION=${PKG_VERSION} clean
