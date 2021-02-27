# Wraps all other Makefiles 

# Variables
PKG_FILES=$(filter-out common.mk,$(wildcard *.mk))
PKG_SLUGS=$(foreach pkg, ${PKG_FILES}, $(addprefix $(shell make -f ${pkg} name VERSION=UNKNOWN)-, $(shell make -f ${pkg} versions VERSION=UNKNOWN)))

# Functions
define pkg_info
	$(eval PKG_SLUG=$(patsubst $1-%,%,$2))
	$(eval PKG_VERSION=$(lastword $(subst -, ,${PKG_SLUG})))
	$(eval PKG_NAME=$(patsubst %-${PKG_VERSION},%,${PKG_SLUG}))
	$(eval PKG_FILE=$(shell grep '^VERSIONS\s*=.*${PKG_VERSION}' $(shell grep "NAME\s*=\s*${PKG_NAME}" ${PKG_FILES} -l) -l))
endef

# Targets

build: $(foreach pkg, ${PKG_FILES}, $(addprefix build-$(shell make -f ${pkg} name VERSION=UNKNOWN)-, $(lastword $(shell make -f ${pkg} versions VERSION=UNKNOWN))))

$(addprefix build-, ${PKG_SLUGS}):
	$(call pkg_info,build,$@)
	$(MAKE) -f ${PKG_FILE} VERSION=${PKG_VERSION} build



clean: $(foreach pkg, ${PKG_FILES}, $(addprefix clean-$(shell make -f ${pkg} name VERSION=UNKNOWN)-, $(shell make -f ${pkg} versions VERSION=UNKNOWN)))
	rm -rf build/
$(addprefix clean-, ${PKG_SLUGS}):
	$(call pkg_info,clean,$@)
	$(MAKE) -f ${PKG_FILE} VERSION=${PKG_VERSION} clean
