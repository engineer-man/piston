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
| **`./piston key generate`**| **Security**: Automatically generate a secret key for API authentication. |
| **`./piston key show`** | **Security**: Show your current key and usage examples. |
| **`./piston sync`** | Synchronize your fork with the original upstream repository. |
| **`./piston rebuild-all`**| **ARM64**: Force a clean, native rebuild of all installed packages. |
| **`./piston list`** | List all currently installed and active language packages. |
| **`./piston install <pkg>`**| Install a pre-built package from the repository. |
| **`./piston uninstall <pkg>`** | Remove a language package (cleanly hides it from the list). |
| **`./piston start / stop`** | Start or stop the Piston API Docker containers. |
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

**Headers:**
- `Content-Type: application/json`
- `Authorization: <your_secret_key>` (If security is enabled)

**Request Body:**
```json
{
    "language": "python",
    "version": "3.12.0",
    "files": [
        {
            "name": "main.py",
            "content": "print('Hello from Native ARM64 Piston!')"
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

Piston includes an automated system to secure your API access.

1.  **Generate a Key**:
    ```bash
    ./piston key generate
    ```
    This creates a random 32-character key and saves it to `.piston_key`.

2.  **Zero-Config Usage**:
    - The **CLI** and the **`./piston`** script automatically discover and use `.piston_key`.
    - The **API Service** picks up the key from the environment via Docker Compose automatically.

3.  **Manual API Calls**:
    Run `./piston key show` to get your key and a pre-formatted `curl` example:
    ```bash
    curl -H "Authorization: YOUR_KEY_HERE" -X POST ...
    ```

## 🍎 Native ARM64 (Apple Silicon) Support

This edition of Piston is optimized for **ARM64 (M1/M2/M3)**. If you see architecture-related errors (like `qemu-x86_64`), ensure your services and runtimes are built natively:

```bash
# Rebuild the Docker containers natively
./piston rebuild

# Rebuild all installed language packages natively
./piston rebuild-all
```

Piston uses [Isolate](https://www.ucw.cz/moe/isolate.1.html) inside Docker for robust sandboxing. It employs Linux namespaces, chroot, and cgroups to ensure:
- No outgoing network interaction by default.
- Resource limits (CPU, Memory, Processes).
- File system isolation and cleanup.

---
*Customized from the original [EngineerMan/Piston](https://github.com/engineer-man/piston).*
