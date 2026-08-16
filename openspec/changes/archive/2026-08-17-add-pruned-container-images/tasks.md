## 1. Build preparation

- [x] 1.1 Add a root .dockerignore for metadata, dependencies, caches, outputs, secrets, and local data
- [x] 1.2 Verify deterministic production scripts and declared workspace dependencies

## 2. Backend image

- [x] 2.1 Add turbo prune backend --docker, frozen install, build, and minimal non-root runtime stages
- [x] 2.2 Separate migration/seed initialization from the server process and add a health check

## 3. Frontend image

- [x] 3.1 Add turbo prune frontend --docker, frozen install, Vite build, and nginx runtime stages
- [x] 3.2 Add SPA fallback, backend reachability configuration, and a health check

## 4. Image verification

- [x] 4.1 Build both images from a clean context
- [x] 4.2 Inspect final images for unpruned sources, caches, secrets, and Storybook tooling/output
