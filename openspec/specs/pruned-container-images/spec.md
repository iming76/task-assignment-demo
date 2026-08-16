## Purpose

This capability defines the externally verifiable behavior for pruned container images so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Reproducible application images

Backend and frontend production images SHALL build from Turborepo-pruned workspaces using the committed lockfile.

#### Scenario: Clean image build

- **WHEN** both Dockerfiles are built from a clean checkout
- **THEN** each build succeeds without undeclared host dependencies

### Requirement: Minimal runtime contents

Final images MUST exclude the unpruned monorepo, dependency caches, secrets, and frontend Storybook tooling/output.

#### Scenario: Runtime image inspected

- **WHEN** the final backend and frontend image contents are examined
- **THEN** only files required to run the corresponding production application are present
