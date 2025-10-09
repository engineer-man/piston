# Copilot instructions for the piston repo — concise reference

Purpose
- Help an AI coding agent become productive quickly by calling out the repository's runtime layout, common dev workflows, and code locations to edit or inspect.

Big picture (what to know first)
- Two main dev services (see docker-compose.dev.yaml):
  - api — the HTTP service (built from the `api/` directory). Exposes port 2000 (host:container = 2000:2000). Uses env PISTON_REPO_URL to locate the package index.
  - repo — local package repository (built from `repo/`). The API points at `http://repo:8000/index` inside docker-compose; open `repo/` and its Dockerfile to confirm exact listen port.
- Persistent packages are stored on the host at ./data/piston/packages and mounted into the api container at /piston/packages. Changes to packages on disk are visible to the running api container.

Quick actionable workflows (exact commands)
- Start dev environment:
  - docker compose -f docker-compose.dev.yaml up --build
  - or to run in background: docker compose -f docker-compose.dev.yaml up --build -d
- View logs:
  - docker compose -f docker-compose.dev.yaml logs -f api
  - docker compose -f docker-compose.dev.yaml logs -f repo
- Rebuild just the api:
  - docker compose -f docker-compose.dev.yaml up --build api
- Exec into a running container:
  - docker compose -f docker-compose.dev.yaml exec api sh
  - or use container names: docker exec -it infoyouth_infoyouth_piston_api sh
- Where to look for CI/test commands:
  - Check top-level files: README.md, Makefile, package.json, pyproject.toml, Dockerfiles, and .github/workflows/* for project-specific test/build commands before inventing them.

Project-specific patterns and conventions
- Docker-first dev flow: each major component has its own build context (api/, repo/). Prefer making changes in the corresponding directory and rebuilding that service.
- Environment linkage: services communicate by docker-compose service name (e.g., `repo`), not hostnames. Keep PISTON_REPO_URL updated when editing compose or integration tests.
- Packages persistence: local packages live under ./data/piston/packages — use this path in integration tests or when seeding sample packages for development.

Where changed code normally belongs
- http routes, handlers, and server code → api/
- package index and repository logic → repo/
- container configuration → api/Dockerfile, repo/Dockerfile, docker-compose.dev.yaml

Examples from this repo
- docker-compose.dev.yaml:
  - api service maps host port 2000 to container 2000 and sets PISTON_REPO_URL=http://repo:8000/index
  - repo service runs with command ['--no-build'] and mounts the full repo (.:/piston)

What to avoid changing blindly
- The api service is run privileged: true in dev compose — confirm why before removing.
- Don’t move the packages volume (./data/piston/packages) without updating any scripts, tests, and PERSISTED paths that expect it.

Tasks an AI can do confidently
- Add or modify an API route: update code in api/, then rebuild only the api container.
- Update package repo behavior: change code in repo/, rebuild and verify with docker compose logs -f repo.
- Seed test packages: write files into ./data/piston/packages and restart api to pick them up.

When you need more info
- Search for project-specific commands and patterns in: README.md, Dockerfiles in api/ and repo/, and any .github/workflows/*. If something is missing or ambiguous, ask the maintainer which test runner or CI job to mirror.

If anything in these instructions is unclear or you need examples of a specific task (add endpoint, seed packages, run tests), tell me which area to expand.