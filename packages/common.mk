# Variables
PKG_SLUG=${NAME}-${VERSION}
BUILD_DIR=build/${PKG_SLUG}/

BIN_DIR=${BUILD_DIR}${PKG_SLUG}/
RUN_FILE=${BUILD_DIR}run
COMPILE_FILE=${BUILD_DIR}compile
ENV_FILE=${BIN_DIR}environment
INFO_FILE=${BUILD_DIR}pkg-info.jq

PKG_FILE=${PKG_SLUG}.pkg.tar.gz

VERSION_MINOR=$(shell grep -oP "\d+.\d+"<<<${VERSION})
VERSION_MAJOR=$(shell grep -oP "\d+"<<<${VERSION})

PKG_TARGETS=${BIN_DIR} ${ENV_FILE} ${RUN_FILE} ${INFO_FILE}


# Command Targets

.PHONY: catch versions name build clean
catch:
	# Catch manual calling
	# This is done to make sure people don't call without ${VERSION}, which can cause problems
	@echo "Don't directly call individual scripts, instead call the common Makefile"
	@exit 1

versions:
	@echo ${VERSIONS}

name:
	@echo ${NAME}

build: ${BUILD_DIR} ${PKG_FILE}
clean: 
	rm -rf ${BUILD_DIR}
	rm -f ${PKG_FILE}

# mkdir
${BUILD_DIR}:
	mkdir -p ${BUILD_DIR}


# Generated files

ifeq (${COMPILED}, true)
${PKG_FILE}: ${PKG_TARGETS} ${COMPILE_FILE}
endif
${PKG_FILE}: ${PKG_TARGETS}
	tar -czC ${BUILD_DIR} -f $@ ${patsubst ${BUILD_DIR}%,%,$?}
	
${INFO_FILE}:
	echo '.language="${NAME}"' > $@
	echo '.version="${VERSION}"' >> $@
	echo '.author="${AUTHOR}"' >> $@
	echo '.dependencies={}' >> $@
	echo '.build_platform="$(or ${PLATFORM}, baremetal-$(shell grep -oP "^ID=\K\w+" /etc/os-release ))"' >> $@
	$(foreach dep, ${DEPENDENCIES}, echo '.dependencies.$(word 1,$(subst =, ,${dep}))="$(word 2,$(subst =, ,${dep}))"' >> $@)



# Helpers

%/: %.tgz
	cd ${BUILD_DIR} && tar xzf $(patsubst ${BUILD_DIR}%,%,$<)
%/: %.tar.gz
	cd ${BUILD_DIR} && tar xzf $(patsubst ${BUILD_DIR}%,%,$<)

%.json: %.jq
	jq '$(shell tr '\n' '|' < $<).' <<< "{}" > $@