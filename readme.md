## Piston
Piston is the underlying engine for running untrusted and possibly malicious
code that originates from EMKC contests and challenges. It's also used in the
Engineer Man Discord server via [I Run Code](https://github.com/engineer-man/piston-bot) bot as well as 1000+ other servers.
To get it in your own server, go here: https://emkc.org/run.

#### Use Public API (new)
Requires no installation and you can use it immediately. Reference the API Usage section below to learn
about the request format but rather than using the local URLs, use the following URLs:
- `GET` `https://emkc.org/api/v1/piston/versions`
- `POST` `https://emkc.org/api/v1/piston/execute`

Important Note: The Piston API is rate limited to 5 requests per second

#### Installation
Updated installation instructions coming soon. See `var/install.txt` for how to do it from scratch.

#### CLI Usage
- `lxc/execute [language] [file path] [arg]...`

#### API Usage
To use the API, it must first be started. To start the API, run the following:
```
cd api
./start
```

#### Base URLs
For your own local installation, use:
```
http://127.0.0.1:2000
```
When using the public Piston API, use:
```
https://emkc.org/api/v1/piston
```

#### Versions Endpoint
`GET /versions`
This endpoint takes no input and returns a JSON array of the currently installed languages.

Truncated response sample:
```json
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

#### Execution Endpoint
`POST /execute`
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
    "language": "js",
    "version": "12.13.0",
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
- awk
- bash
- c
- cpp
- csharp
- deno
- elixir
- emacs
- go
- haskell
- java
- jelly
- julia
- kotlin
- nasm
- node
- perl
- php
- python2
- python3
- paradoc
- ruby
- rust
- swift
- typescript

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
