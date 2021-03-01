# Wraps all other Makefiles 

# Variables
PKG_FILES=$(filter-out common.mk,$(wildcard *.mk))
PKG_SLUGS=$(foreach pkg, ${PKG_FILES}, $(addprefix $(shell make -f ${pkg} name VERSION=UNKNOWN)-, $(shell make -f ${pkg} versions VERSION=UNKNOWN)))

# Functions
CALL_MAKE=$(shell make -f $1 $2 VERSION=UNKNOWN)

define pkg_info
	$(eval PKG_SLUG=$(patsubst $1-%,%,$2))
	$(eval PKG_VERSION=$(lastword $(subst -, ,${PKG_SLUG})))
	$(eval PKG_NAME=$(patsubst %-${PKG_VERSION},%,${PKG_SLUG}))
	$(eval PKG_FILE=$(shell grep '^VERSIONS\s*=.*${PKG_VERSION}' $(shell grep "NAME\s*=\s*${PKG_NAME}" ${PKG_FILES} -l) -l))
endef

define per-lang
build-$(call CALL_MAKE, $1, name):: $$(addprefix build-$(call CALL_MAKE, $1, name)-, $$(call CALL_MAKE, $1, versions))
clean-$(call CALL_MAKE, $1, name):: $$(addprefix clean-$(call CALL_MAKE, $1, name)-, $$(call CALL_MAKE, $1, versions))
endef


# Targets

$(foreach e,${PKG_FILES}, $(eval $(call per-lang,${e})))

build build-all: $(foreach pkg, ${PKG_FILES}, build-$(call CALL_MAKE, ${pkg}, name))

$(addprefix build-, ${PKG_SLUGS}):
	$(call pkg_info,build,$@)
	$(MAKE) -f ${PKG_FILE} VERSION=${PKG_VERSION} build

clean clean-all: $(foreach pkg, ${PKG_FILES}, clean-$(call CALL_MAKE, ${pkg}, name))
	rm -rf build/

$(addprefix clean-, ${PKG_SLUGS}):
	$(call pkg_info,clean,$@)
	$(MAKE) -f ${PKG_FILE} VERSION=${PKG_VERSION} clean


