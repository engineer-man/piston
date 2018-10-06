## Piston
Piston is the underlying engine for running untrusted and possibly malicious code that originates
from from EMKC contests and challenges. It's also used in the Engineer Man Discord server via
[felix bot](https://github.com/engineer-man/felix).

#### Installation
- Install Docker https://www.docker.com/get-started
- `git clone https://github.com/engineer-man/piston`
- `cd piston/docker`
- `./build`

#### Usage
- `docker/execute <lang> <path to file>`

#### Supported Languages
Currently python2, python3, c, c++, go, node, ruby, r, c#, nasm, php, and java is supported.

#### Principle of Operation
Piston utilizes Docker as the primary mechanism for sandboxing. There is a small API written in Go which takes
in execution requests and spawns new containers to execute the source from that request. High level, the API writes
a temporary source file to `/tmp` and that gets mounted read-only along with the execution scripts into the container.
The source file is either ran or compiled and ran (in the case of languages like c, c++, c#, go, etc.).

#### Security
Docker provides a great deal of security out of the box. Piston takes additional steps to make it resistant to
various privilege escalation, denial-of-service, and resource saturation threats. These steps include:
- Disabling outgoing network interaction
- Capping memory at 64mb (resists RAM saturation)
- Capping max processes at 16 (resists `:(){ :|: &}:;`, `while True: os.fork()`, etc.)
- Capping max files at 256 (resists various file based attacks)
- Mounting all resources read-only (resists `sudo rm -rf --no-preserve-root /`)
- Capping runtime execution at 3 seconds
- Capping stdout to 65536 characters (resists yes/no bombs and runaway output)
- SIGKILLing misbehaving code
- Disabling journald logs (resists log flood)

#### Performance
One thing that needs investigation is how to spawn containers faster. The Docker daemon is synchronous in its
container spawning. This means the bottleneck for code execution is how fast containers can start. Environments
vary, but, in ours they start at a rate of no more than 1-2 per second. One possibility is Docker in Docker where by
X number of containers stay running all the time and then requests are delivered to each in a round robin and spawn
new Piston containers.

#### License
Piston is licensed under the MIT license.
