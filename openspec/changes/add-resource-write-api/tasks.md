## 1. Developer and skill writes

- [ ] 1.1 Implement developer create and complete name/skill update behavior
- [ ] 1.2 Implement skill create/update with description, category validation, and scoped uniqueness
- [ ] 1.3 Implement developer and skill deletion with NOT_FOUND handling

## 2. Safety and tests

- [ ] 2.1 Reject assigned-developer and referenced-skill deletion with IN_USE
- [ ] 2.2 Translate known database constraints into public errors and keep writes transactional
- [ ] 2.3 Test successful mutations, bad IDs, duplicates, and every in-use relationship
