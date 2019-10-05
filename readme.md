## Piston
Piston is the underlying engine for running untrusted and possibly malicious code that originates from EMKC contests and challenges. It's also used in the Engineer Man Discord server via
[felix bot](https://github.com/engineer-man/felix).

#### Installation
```
# clone and enter repo
git clone https://github.com/engineer-man/piston
cd piston/lxc

# install dependencies

# centos:
yum install -y epel-release
yum install -y lxc lxc-templates debootstrap libvirt
systemctl start libvirtd

# ubuntu server 18.04:
apt install lxc lxc-templates debootstrap libvirt0

# everything else:
# not documented, please open pull requests with commands for debian/arch/macos

# create and start container
lxc-create -t download -n piston -- --dist ubuntu --release bionic --arch amd64
./start

# open a shell to the container
./shell

# install all necessary piston dependencies
export HOME=/opt
echo 'export PATH=/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/sbin' >> /root/.bashrc
echo 'export PATH=$PATH:/root/.cargo/bin' >> /root/.bashrc
sed -i \
    's/http:\/\/archive.ubuntu.com\/ubuntu/http:\/\/mirror.math.princeton.edu\/pub\/ubuntu/' \
    /etc/apt/sources.list
apt-get update
apt-get -y install git tzdata nano \
    dpkg-dev build-essential python python3 \
    ruby nodejs npm golang php7.2 r-base mono-complete \
    nasm openjdk-8-jdk ubuntu-make bf
npm install -g typescript
umake swift
ln -s /opt/.local/share/umake/swift/swift-lang/usr/bin/swift /usr/bin/swift
curl https://sh.rustup.rs > rust.sh
sh rust.sh -y
ln -s /opt/.cargo/bin/rustc /usr/bin/rustc
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

#### CLI Usage
- `lxc/execute [language] [file path] [arg]...`

#### API Usage
To use the API, it must first be started. To start the API, run the following:
```
cd api
./start
```
The Piston API exposes one endpoint at `http://127.0.0.1:2000/execute`.
This endpoint takes the following JSON payload and expects at least the language and source. If
source is not provided, a blank file is passed as the source.
```json
{
    "language": "js",
    "source": "console.log(process.argv)",
    "args": [
        "1",
        "2",
        "3"
    ]
}
```
A typical response when everything succeeds will be similar to the following:
```json
{
    "ran": true,
    "output": "[ '/usr/bin/node',\n  '/tmp/code.code',\n  '1',\n  '2',\n  '3' ]"
}
```
If an invalid language is supplied, a typical response will look like the following:
```json
{
    "code": "unsupported_language",
    "message": "whatever is not supported by Piston"
}
```

#### Supported Languages
Currently python2, python3, c, c++, go, node, ruby, r, c#, nasm, php, java, swift, brainfuck, rust, bash, and typescript is supported.

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
- Capping max processes at 64 (resists `:(){ :|: &}:;`, `while True: os.fork()`, etc.)
- Capping max files at 2048 (resists various file based attacks)
- Mounting all resources read-only (resists `sudo rm -rf --no-preserve-root /`)
- Running as a variety of unprivileged users
- Capping runtime execution at 3 seconds
- Capping stdout to 65536 characters (resists yes/no bombs and runaway output)
- SIGKILLing misbehaving code

#### License
Piston is licensed under the MIT license.
