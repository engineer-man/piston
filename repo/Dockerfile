FROM debian:buster-slim

RUN apt-get update && apt-get install -y bc curl git linux-headers-amd64 perl xz-utils python3 python3-pip gnupg jq zlib1g-dev cmake cmake-doc extra-cmake-modules build-essential gcc binutils bash coreutils util-linux pciutils usbutils coreutils binutils findutils grep && \
        ln -sf /bin/bash /bin/sh && \
        pip3 install 'yq==2.12.0' && \
        rm -rf /var/lib/apt/lists/*

CMD [ "bash", "/repo/make.sh" ]