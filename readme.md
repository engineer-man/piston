# Piston (Personal Edition)

A high-performance, general-purpose code execution engine, customized for personal use. Piston allows you to run untrusted and potentially malicious code in a secure, sandboxed environment.

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (for the CLI)
- Cgroup v2 enabled (for sandboxing)
- **Supported Architectures**: x86_64 (Intel/AMD) and ARM64 (Apple Silicon/M-series).
- **Security (Optional)**: A secret key via the `PISTON_KEY` environment variable.

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/engineer-man/piston
   cd piston
   ```

2. **Initialize Piston:**
   The recommended way to start is using the **Setup Wizard**:
   ```sh
   ./piston setup
   ```
   *This will start the API, scan your local packages, and guide you through building and installing your first runtimes.*

## 🛠 Usage

### Management Script (`./piston`)

The `./piston` script is your main entry point for managing the service.

| Command | Description |
| :--- | :--- |
| **`./piston setup`** | **(Recommended)** Interactive wizard for building and installing languages. |
| **`./piston list`** | List all currently installed and active language packages. |
| **`./piston list --all`** | List every package available in the repository index. |
| **`./piston install <pkg>`**| Install a pre-built package from the repository. |
| **`./piston uninstall <pkg>`** | Remove a language package (cleanly hides it from the list). |
| **`./piston sync`** | Synchronize your fork with the original upstream repository. |
| **`./piston start / stop`** | Start or stop the Piston API Docker containers. |
| **`./piston restart`** | Restart the Piston environment. |
| **`./piston logs`** | View live logs from the API and repository services. |

### CLI (`core/cli/index.js`)

You can also interact with the CLI directly via the helper script for more advanced usage:

```sh
# Run a script immediately
echo 'print("Hello from Piston!")' > test.py
./piston run python test.py
```

## 🌐 API Reference

The Piston API is exposed on port **2000** by default.

### Execute Code
`POST /api/v2/execute`

**Request Body:**
```json
{
    "language": "python",
    "version": "3.10.0",
    "files": [
        {
            "name": "main.py",
            "content": "print('Hello, Piston!')"
        }
    ]
}
```

### Get Runtimes
`GET /api/v2/runtimes`

Returns a list of installed languages and versions.

## 🗂 Project Structure

- `core/api`: The backend execution engine.
- `core/cli`: Command-line tool for package management and testing.
- `core/repo`: Local package repository for building and caching runtimes.
- `packages/`: Docker build specifications for each language.
- `data/`: Persistent storage for installed packages.

## 🛡 Security & Authentication

By default, the Piston API is open to anyone with network access to the port. For personal use, you can secure it with a secret key.

1.  **Set the Key**: Add `PISTON_KEY=your_secret_here` to your environment variables for the API service (or in your shell).
2.  **CLI Usage**: The CLI will automatically pick up the `PISTON_KEY` from your environment.
3.  **Manual API Calls**: Include the key in the `Authorization` header:
    ```bash
    curl -H "Authorization: your_secret_here" ...
    ```

Piston uses [Isolate](https://www.ucw.cz/moe/isolate.1.html) inside Docker for robust sandboxing. It employs Linux namespaces, chroot, and cgroups to ensure:
- No outgoing network interaction by default.
- Resource limits (CPU, Memory, Processes).
- File system isolation and cleanup.

---
*Customized from the original [EngineerMan/Piston](https://github.com/engineer-man/piston).*
