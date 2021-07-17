# Configuration

Piston provides many different configuration options to tweak Piston to meet your needs.

Configuration is specified through environment variables, prefixed with `PISTON_`.

## Log Level

```yaml
key: PISTON_LOG_LEVEL
default: INFO
```

Level of log output to provide.

One of `DEBUG`, `INFO`, `WARN`, `ERROR` or `NONE`

## Bind Address

```yaml
key: PISTON_BIND_ADDRESS
default: 0.0.0.0:2000
```

Port and IP address to bind the Piston API to.

<!-- prettier-ignore -->
!!! warning
    Changing this value is not recommended.

    This changes the bind address inside the container, and thus serves no purpose when running in a container

## Data Directory

```yaml
key: PISTON_DATA_DIRECTORY
default: /piston
```

Absolute path to piston related data, including packages and job contexts.

<!-- prettier-ignore -->
!!! warning
    Changing this value is not recommended.

    Some packages require absolute paths on disk at build time.
    Due to this, some packages may break when changing this parameter.

## Runner GID/UID range

```yaml
key:
  - PISTON_RUNNER_UID_MIN
  - PISTON_RUNNER_UID_MAX
  - PISTON_RUNNER_GID_MIN
  - PISTON_RUNNER_GID_MAX
default:
  - 1001
  - 1500
  - 1001
  - 1500
```

UID and GID ranges to use when executing jobs.

<!-- prettier-ignore -->
!!! warning
    Changing this value is not recommended.

    The piston container creates 500 users and groups by default, and reserves user/group 1000 for running the API.
    Any processes run by these users will be killed when cleaning up a job.

## Disable Networking

```yaml
key: PISTON_DISABLE_NETWORKING
default: true
```

Disallows access to `socket` syscalls, effectively disabling networking for jobs run by piston.

## Max Process Count

```yaml
key: PISTON_MAX_PROCESS_COUNT
default: 64
```

Maximum number of processess allowed to to have open for a job.

Resists against exhausting the process table, causing a full system lockup.

## Output Max Side

```yaml
key: PISTON_OUTPUT_MAX_SIZE
default: 1024
```

Maximum size of stdio buffers for each job.

Resist against run-away output which could lead to memory exhaustion.

## Max Open Files

```yaml
key: PISTON_MAX_OPEN_FILES
default: 64
```

Maximum number of open files at a given time by a job.

Resists against writing many smaller files to exhaust inodes.

## Max File Size

```yaml
key: PISTON_MAX_FILE_SIZE
default: 10000000 #10MB
```

Maximum size for a singular file written to disk.

Resists against large file writes to exhaust disk space.

## Compile/Run memory limits

```yaml
key:
  - PISTON_COMPILE_MEMORY_LIMIT
  - PISTON_RUN_MEMORY_LIMIT
default: -1
```

Maximum memory allowed by a stage in bytes.
Use -1 for unlimited memory usage.

Useful for running memory-limited contests.

## Repository URL

```yaml
key: PISTON_REPO_URL
default: https://github.com/engineer-man/piston/releases/download/pkgs/index
```

URL for repository index, where packages will be downloaded from.
