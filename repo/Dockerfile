FROM alpine:3.13

RUN apk add --no-cache python3 py3-pip gnupg jq zlib zlib-dev cmake cmake-doc extra-cmake-modules extra-cmake-modules-doc build-base gcc abuild binutils binutils-doc gcc-doc yq bash coreutils util-linux pciutils usbutils coreutils binutils findutils grep && \
        ln -sf /bin/bash /bin/sh && \
        pip3 install 'yq==2.12.0'

CMD [ "bash", "/repo/make.sh" ]