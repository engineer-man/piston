## Piston
Piston is a high performance general purpose code execution engine. It excels at running untrusted and
possibly malicious code without fear from any harmful effects.
It's used in numerous places including
[EMKC Challenges](https://emkc.org/challenges),
[EMKC Weekly Contests](https://emkc.org/contests), the
[Engineer Man Discord Server](https://discord.gg/engineerman) via
[I Run Code](https://github.com/engineer-man/piston-bot) bot as well as 1300+ other servers
and 100+ direct integrations. To get it in your own server, go here: https://emkc.org/run.

#### Use Public API
Requires no installation and you can use it immediately. Reference the Versions/Execute sections
below to learn about the request and response formats.
- `GET` `https://emkc.org/api/v1/piston/versions`
- `POST` `https://emkc.org/api/v1/piston/execute`

Important Note: The Piston API is rate limited to 5 requests per second. If you have a need for more requests than that
and it's for a good cause, please reach out to me (EngineerMan#0001) on [Discord](https://discord.gg/engineerman)
so we can discuss potentially getting you an unlimited key.

#### Cloning and System Dependencies
```
# clone and enter repo
git clone https://github.com/engineer-man/piston
cd piston/lxc

# centos/rhel dependencies:
yum install -y epel-release
yum install -y lxc lxc-templates debootstrap libvirt
systemctl start libvirtd

# ubuntu server 18.04 dependencies:
apt install lxc lxc-templates debootstrap libvirt0

# arch dependencies:
sudo pacman -S lxc libvirt unzip

# everything else:
# not documented, please open pull requests with commands for debian/arch/macos/etc
```

#### Installation (simple)
Coming soon.

#### Installation (advanced/manual)
See `var/install.txt` for how to create a new LXC container and install all of the required
software.

#### CLI Usage
- `lxc/execute [language] [file path] [args]`

#### API Usage
To use the API, it must first be started. Please note that if root is required to access
LXC then the API must also be running as root. To start the API, run the following:
```
cd api
./start
```

#### Base URLs
When using the public Piston API, use:
```
https://emkc.org/api/v1/piston
```
For your own local installation, use:
```
http://127.0.0.1:2000
```

#### Versions Endpoint
`GET /versions`
This endpoint takes no input and returns a JSON array of the currently installed languages.

Truncated response sample:
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
    {
        "name": "awk",
        "version": "1.3.3"
    },
    {
        "name": "bash",
        "version": "4.4.20"
    },
    {
        "name": "c",
        "version": "7.5.0"
    }
]
```

#### Execute Endpoint
`POST /execute`
This endpoint takes the following JSON payload and expects at least the language and source. If
source is not provided, a blank file is passed as the source. If no `args` are desired, it can either
be an empty array or left out entirely.
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
If an invalid language is supplied, a typical response will look like the following:
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
    "code": "unsupported_language",
    "message": "whatever is not supported by Piston"
}
```

#### Supported Languages
- awk
- bash
- brainfuck
- c
- cpp
- csharp
- deno
- erlang
- elixir
- emacs
- elisp
- go
- haskell
- java
- jelly
- julia
- kotlin
- lua
- nasm
- node
- paradoc
- perl
- php
- python2
- python3
- ruby
- rust
- swift
- typescript

#### Principle of Operation
Piston utilizes LXC as the primary mechanism for sandboxing. There is a small API written in Node which takes
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
- Cleaning up all temp space after each execution (resists out of drive space attacks)
- Running as a variety of unprivileged users
- Capping runtime execution at 3 seconds
- Capping stdout to 65536 characters (resists yes/no bombs and runaway output)
- SIGKILLing misbehaving code

#### License
Piston is licensed under the MIT license.
