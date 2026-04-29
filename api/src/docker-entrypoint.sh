#!/bin/bash
#
# Piston API container entrypoint.
#
# When the container is launched with full privileges (the supported
# production setup, e.g. `docker run --privileged ... ghcr.io/engineer-man/piston`)
# we initialise cgroup v2 the way isolate expects.
#
# When the container is launched on a managed platform that disallows
# privileged mode (Railway, Render, Cloud Run, ...) the cgroup setup will
# fail. In that case we log a warning, optionally enable the no-isolate
# fallback (PISTON_DISABLE_ISOLATE=true) and start the API as the `piston`
# user anyway so the HTTP service can still come up. Code execution will
# only work when PISTON_DISABLE_ISOLATE=true (which trades the isolate
# sandbox for plain `bash` execution).

set -u

CGROUP_FS="/sys/fs/cgroup"
ISOLATE_READY=1

warn() { echo "[entrypoint] WARN: $*" >&2; }
info() { echo "[entrypoint] $*"; }

setup_cgroup() {
    if [ ! -e "$CGROUP_FS" ]; then
        warn "Cannot find $CGROUP_FS -- cgroup v2 unavailable."
        return 1
    fi

    if [ -e "$CGROUP_FS/unified" ]; then
        warn "Combined cgroup v1+v2 mode detected; isolate requires pure cgroup v2."
        return 1
    fi

    if [ ! -e "$CGROUP_FS/cgroup.subtree_control" ]; then
        warn "cgroup v2 not enabled on this host."
        return 1
    fi

    cd /sys/fs/cgroup || return 1
    mkdir -p isolate/ 2>/dev/null || { warn "mkdir isolate/ failed (need privileged container)"; return 1; }
    echo 1 > isolate/cgroup.procs 2>/dev/null || { warn "writing isolate/cgroup.procs failed"; return 1; }
    echo '+cpuset +cpu +io +memory +pids' > cgroup.subtree_control 2>/dev/null || \
        { warn "writing cgroup.subtree_control failed"; return 1; }
    cd isolate || return 1
    mkdir -p init
    echo 1 > init/cgroup.procs 2>/dev/null || { warn "writing init/cgroup.procs failed"; return 1; }
    echo '+cpuset +memory' > cgroup.subtree_control 2>/dev/null || \
        { warn "writing isolate subtree_control failed"; return 1; }
    info "Initialized cgroup v2 for isolate"
    return 0
}

if ! setup_cgroup; then
    ISOLATE_READY=0
    if [ "${PISTON_DISABLE_ISOLATE:-false}" != "true" ]; then
        warn "isolate sandbox is not available."
        warn "Set PISTON_DISABLE_ISOLATE=true to run code without sandboxing"
        warn "(only do this on trusted, low-volume deployments)."
    else
        info "PISTON_DISABLE_ISOLATE=true -- code will execute without the isolate sandbox."
    fi
fi

# Make sure the data directory exists and is writable by the piston user.
DATA_DIR="${PISTON_DATA_DIRECTORY:-/piston}"
mkdir -p "$DATA_DIR/packages" "$DATA_DIR/jobs"
if id piston >/dev/null 2>&1; then
    chown -R piston:piston "$DATA_DIR" 2>/dev/null || \
        warn "chown $DATA_DIR failed (will try to run as current user)"
fi

# Forward $PORT (Railway/Heroku/etc.) into PISTON_BIND_ADDRESS unless the
# operator already supplied a bind address explicitly.
if [ -z "${PISTON_BIND_ADDRESS:-}" ] && [ -n "${PORT:-}" ]; then
    export PISTON_BIND_ADDRESS="0.0.0.0:${PORT}"
fi

START_CMD="ulimit -n 65536 && node /piston_api/src"

if [ "$(id -u)" = "0" ] && id piston >/dev/null 2>&1; then
    info "Starting API as user 'piston' on ${PISTON_BIND_ADDRESS:-default bind address}"
    exec su -- piston -c "$START_CMD"
else
    info "Starting API as $(id -un) on ${PISTON_BIND_ADDRESS:-default bind address}"
    # shellcheck disable=SC2086
    ulimit -n 65536 || true
    exec node /piston_api/src
fi
