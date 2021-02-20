FROM alpine:3.13

RUN apk add --no-cache gnupg jq zlib zlib-dev cmake cmake-doc extra-cmake-modules extra-cmake-modules-doc build-base gcc abuild binutils binutils-doc gcc-doc yq bash coreutils util-linux pciutils usbutils coreutils binutils findutils grep && \
        ln -sf /bin/bash /bin/sh && \
        wget https://github.com/mikefarah/yq/releases/download/2.4.1/yq_linux_amd64 -O /usr/bin/yq &&\
        chmod +x /usr/bin/yq

CMD [ "bash", "/repo/make.sh" ]