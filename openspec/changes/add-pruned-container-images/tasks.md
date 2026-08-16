## 1. Build preparation

- [ ] 1.1 Add a root .dockerignore for metadata, dependencies, caches, outputs, secrets, and local data
- [ ] 1.2 Verify deterministic production scripts and declared workspace dependencies

## 2. Backend image

- [ ] 2.1 Add turbo prune backend --docker, frozen install, build, and minimal non-root runtime stages
- [ ] 2.2 Separate migration/seed initialization from the server process and add a health check

## 3. Frontend image

- [ ] 3.1 Add turbo prune frontend --docker, frozen install, Vite build, and nginx runtime stages
- [ ] 3.2 Add SPA fallback, backend reachability configuration, and a health check

## 4. Image verification

- [ ] 4.1 Build both images from a clean context
- [ ] 4.2 Inspect final images for unpruned sources, caches, secrets, and Storybook tooling/output
