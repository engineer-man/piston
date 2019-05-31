## Piston
Piston is the underlying engine for running untrusted and possibly malicious code that originates
from from EMKC contests and challenges. It's also used in the Engineer Man Discord server via
[felix bot](https://github.com/engineer-man/felix).

#### Installation
```
# clone and enter repo
git clone https://github.com/engineer-man/piston
cd piston/lxc

# install dependencies

# centos:
yum install epel-release
yum install lxc lxc-templates debootstrap libvirt

# everything else:
# not documented, please open pull requests with commands for ubuntu/debian/arch/macos

# start libvirtd
systemctl start libvirtd

# create and start container
lxc-create -t download -n piston -- --dist ubuntu --release bionic --arch amd64
./start

# open a shell to the containr
./shell

# install all necessary piston dependencies
export PATH=/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/sbin
sed -i 's/http:\/\/archive.ubuntu.com\/ubuntu/http:\/\/mirror.math.princeton.edu\/pub\/ubuntu/' /etc/apt/sources.list
apt-get update
apt-get -y install git tzdata nano \
    dpkg-dev build-essential python python3 \
    ruby nodejs golang php7.2 r-base mono-complete \
    nasm openjdk-8-jdk ubuntu-make
# IMPORTANT: set dir to /opt/swift/swift-lang
umake swift
ln -s /opt/swift/swift-lang/usr/bin/swift /usr/bin/swift
rm -rf /home/ubuntu
chmod 777 /tmp

# create runnable users and apply limits
for i in {1..150}; do
    useradd -M runner$i
    usermod -d /tmp runner$i
    echo "runner$i soft nproc 64" >> /etc/security/limits.conf
    echo "runner$i hard nproc 64" >> /etc/security/limits.conf
    echo "runner$i soft nofile 2048" >> /etc/security/limits.conf
    echo "runner$i hard nofile 2048" >> /etc/security/limits.conf
done

# leave container
exit

# optionally run tests
cd ../tests
./test_all_lxc
```

#### Usage
- `lxc/execute [language] [path] [arg]...`

#### Supported Languages
Currently python2, python3, c, c++, go, node, ruby, r, c#, nasm, php, and java is supported.

#### Principle of Operation
Piston utilizes LXC as the primary mechanism for sandboxing. There is a small API written in Go which takes
in execution requests and executes them in the container. High level, the API writes
a temporary source and args file to `/tmp` and that gets mounted read-only along with the execution scripts into the container.
The source file is either ran or compiled and ran (in the case of languages like c, c++, c#, go, etc.).

#### Security
LXC provides a great deal of security out of the box in that it's separate from the system.
Piston takes additional steps to make it resistant to
various privilege escalation, denial-of-service, and resource saturation threats. These steps include:
- Disabling outgoing network interaction
- Capping max processes at 16 (resists `:(){ :|: &}:;`, `while True: os.fork()`, etc.)
- Capping max files at 256 (resists various file based attacks)
- Mounting all resources read-only (resists `sudo rm -rf --no-preserve-root /`)
- Capping runtime execution at 3 seconds
- Capping stdout to 65536 characters (resists yes/no bombs and runaway output)
- SIGKILLing misbehaving code

#### License
Piston is licensed under the MIT license.
