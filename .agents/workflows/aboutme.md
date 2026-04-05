---
description: Personal Piston Management Workflow
---

# Piston (Personal Edition)

This repository is optimized for local, personal code execution on both **ARM64 (Apple Silicon)** and **x86_64** architectures.

## ✨ Core Features
- **Debian Bullseye (11)** based build system for stability.
- **Interactive Setup**: Bootstrapped via `./piston setup`.
- **Simplified CLI**: Shorthand commands for management:
  - `list`: Show active runtimes.
  - `install <pkg>`: Add a pre-built language.
  - `uninstall <pkg>`: Remove a runtime cleanly.

## 🛠 Management SOP

1. **Initialization**: Always start with `./piston setup` to ensure all services are up and packages are indexed.
2. **Package Discovery**: Use `./piston list --all` to see available packages.
3. **Upstream Updates**: Periodically run `./piston sync` to fetch new languages and engine improvements from the original repository.
4. **Execution**: Run code using `./piston run <lang> <file>`.

## 🧬 Architecture Support
- **M-Series Mac**: Fully supported with native ARM64 Node.js binaries.
- **Intel/AMD**: Fully supported with x64 binaries.
- The build system automatically detects the platform and downloads the correct assets.

---
// turbo-all
