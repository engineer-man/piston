<h1 align="center">
    <a href="https://github.com/engineer-man/piston"><img src="images/icon_circle.svg" width="25" height="25" alt="engineer-man piston"></a>
  Piston
</h1>

<h3 align="center">A high performance general purpose code execution engine.</h3>
<br>

<p align="center">
    <a href="https://github.com/engineer-man/piston/commits/master">
    <img src="https://img.shields.io/github/last-commit/engineer-man/piston.svg?style=for-the-badge&logo=github&logoColor=white"
         alt="GitHub last commit">
    <a href="https://github.com/engineer-man/piston/issues">
    <img src="https://img.shields.io/github/issues/engineer-man/piston.svg?style=for-the-badge&logo=github&logoColor=white"
         alt="GitHub issues">
    <a href="https://github.com/engineer-man/piston/pulls">
    <img src="https://img.shields.io/github/issues-pr-raw/engineer-man/piston.svg?style=for-the-badge&logo=github&logoColor=white"
         alt="GitHub pull requests">
</p>

---

<h4 align="center">
  <a href="#About">About</a> •
  <a href="#Public-API">Public API</a> •
  <a href="#Getting-Started">Getting Started</a> •
  <a href="#Usage">Usage</a> •
  <a href="#Supported-Languages">Supported Languages</a> •
  <a href="#Principle-of-Operation">Principles</a> •
  <a href="#Security">Security</a> •
  <a href="#License">License</a>
</h4>

---
<br>

# About

<h4>
Piston is a high performance general purpose code execution engine. It excels at running untrusted and
possibly malicious code without fear from any harmful effects.
</h4>
<br>

It's used in numerous places including:
* [EMKC Challenges](https://emkc.org/challenges),
* [EMKC Weekly Contests](https://emkc.org/contests),
* [Engineer Man Discord Server](https://discord.gg/engineerman),
* [I Run Code (Discord Bot)](https://github.com/engineer-man/piston-bot) bot as well as 1300+ other servers
and 100+ direct integrations.

To get it in your own server, go here: https://emkc.org/run.

<br>

# Public API

- Requires no installation and you can use it immediately.
- Reference the Versions/Execute sections below to learn about the request and response formats.

<br>

When using the public Piston API, use the base URL:

```
https://emkc.org/api/v1/piston
```

#### GET
```
https://emkc.org/api/v1/piston/versions
```
#### POST
```
https://emkc.org/api/v1/piston/execute
```

> Important Note: The Piston API is rate limited to 5 requests per second. If you have a need for more requests than that
and it's for a good cause, please reach out to me (EngineerMan#0001) on [Discord](https://discord.gg/engineerman)
so we can discuss potentially getting you an unlimited key.

<br>

# Getting Started

### Host System Package Dependencies

* NodeJS
* lxc
* libvirt

<br>

If your OS is not documented below, please open pull requests with the correct commands for your OS.

<details>
<summary><span style="font-size:1.43em;">CentOS / RHEL</span></summary>

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
nvm install --lts
nvm use --lts

yum install -y epel-release
yum install -y lxc lxc-templates debootstrap libvirt
systemctl start libvirtd
```
</details>

<details>
<summary><span style="font-size:1.43em;">Ubuntu (18.04)</span></summary>

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
nvm install --lts
nvm use --lts

apt install -y lxc lxc-templates debootstrap libvirt0
```
</details>

<details>
<summary><span style="font-size:1.43em;">Arch Linux</span></summary>

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
nvm install --lts
nvm use --lts

pacman -S lxc libvirt unzip
```
</details>

#### After system dependencies are installed, clone this repository:

```sh
# clone and enter repo
git clone https://github.com/engineer-man/piston
```

#### Installation (simple)

- Install additional dependencies python3, pip and distrobuilder
- `cd container && ./build.sh`
- Wait, it may take up to an hour.
- `lxc-create -n piston -t local -- --metadata meta.tar.xz --fstree rootfs.tar.xz`
- `cd lxc && ./start`
- Good to go!


#### Installation (advanced)

- See `var/install.txt` for how to build the container manually

#### CLI Usage
- `cli/execute [language] [file path] [args]`
<br>

# Usage

### CLI

```sh
lxc/execute [language] [file path] [args]
```

### API
To use the API, it must first be started. Please note that if root is required to access
LXC then the API must also be running as root. To start the API, run the following:

```
cd api
./start
```

For your own local installation, the API is available at:

```
http://127.0.0.1:2000
```

#### Versions Endpoint
`GET /versions`
This endpoint will return the supported languages along with the current version and aliases. To execute
code for a particular language using the `/execute` endpoint, either the name or one of the aliases must
be provided.
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
    {
        "name": "awk",
        "aliases": ["awk"],
        "version": "1.3.3"
    },
    {
        "name": "bash",
        "aliases": ["bash"],
        "version": "4.4.20"
    },
    {
        "name": "c",
        "aliases": ["c"],
        "version": "7.5.0"
    }
]
```

#### Execute Endpoint
`POST /execute`
This endpoint requests execution of some arbitrary code.
- `language` (**required**) The language to use for execution, must be a string and supported by Piston (see list below).
- `source` (**required**) The source code to execute, must be a string.
- `stdin` (*optional*) The text to pass as stdin to the program. Must be a string or left out of the request.
- `args` (*optional*) The arguments to pass to the program. Must be an array or left out of the request.
```json
{
    "language": "js",
    "source": "console.log(process.argv)",
    "stdin": "",
    "args": [
        "1",
        "2",
        "3"
    ]
}
```
A typical response upon successful execution will contain the `language`, `version`, `output` which
is a combination of both `stdout` and `stderr` but in chronological order according to program output,
as well as separate `stdout` and `stderr`.
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
    "ran": true,
    "language": "js",
    "version": "12.13.0",
    "output": "[ '/usr/bin/node',\n  '/tmp/code.code',\n  '1',\n  '2',\n  '3' ]",
    "stdout": "[ '/usr/bin/node',\n  '/tmp/code.code',\n  '1',\n  '2',\n  '3' ]",
    "stderr": ""
}
```
If a problem exists with the request, a `400` status code is returned and the reason in the `message` key.
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
    "message": "Supplied language is not supported by Piston"
}
```

<br>

# Supported Languages
`awk`,
`bash`,
`brainfuck`,
`c`,
`cpp`,
`crystal`,
`csharp`,
`d`,
`dash`,
`deno`,
`elixir`,
`emacs`,
`elisp`,
`go`,
`haskell`,
`java`,
`jelly`,
`julia`,
`kotlin`,
`lisp`,
`lua`,
`nasm`,
`nasm64`,
`nim`,
`node`,
`osabie`,
`paradoc`,
`perl`,
`php`,
`python2`,
`python3`,
`ruby`,
`rust`,
`scala`,
`swift`,
`typescript`,
`zig`,

<br>

# Principle of Operation
Piston utilizes LXC as the primary mechanism for sandboxing. There is a small API written in Node which takes
in execution requests and executes them in the container. High level, the API writes
a temporary source and args file to `/tmp` and that gets mounted read-only along with the execution scripts into the container.
The source file is either ran or compiled and ran (in the case of languages like c, c++, c#, go, etc.).

<br>

# Security
LXC provides a great deal of security out of the box in that it's separate from the system.
Piston takes additional steps to make it resistant to
various privilege escalation, denial-of-service, and resource saturation threats. These steps include:
- Disabling outgoing network interaction
- Capping max processes at 64 (resists `:(){ :|: &}:;`, `while True: os.fork()`, etc.)
- Capping max files at 2048 (resists various file based attacks)
- Mounting all resources read-only (resists `sudo rm -rf --no-preserve-root /`)
- Cleaning up all temp space after each execution (resists out of drive space attacks)
- Running as a variety of unprivileged users
- Capping runtime execution at 3 seconds
- Capping stdout to 65536 characters (resists yes/no bombs and runaway output)
- SIGKILLing misbehaving code

<br>

# License
Piston is licensed under the MIT license.
