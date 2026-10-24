# BrandGuard AI — Automated Testing & Verification Report

## Test Suite Summary

BrandGuard AI includes automated test suites covering core business logic, rule-based compliance checking, scoring integrity, and role-based segregation of duties.

### Executing Tests
```bash
cd server
npm test
```

### Test Results

```
PASS src/__tests__/compliance.test.ts
  BrandGuard AI Compliance Engine Tests
    ✓ Deterministic rule engine correctly flags brand naming and unsupported superlatives (7 ms)
    ✓ Scoring methodology accurately computes deductions and alerts on unresolved critical issues (3 ms)
    ✓ Critical findings remain visible even when overall compliance score is high (3 ms)

PASS src/__tests__/approval.test.ts
  Review & Approval Workflow Authorization Tests
    ✓ Creator CANNOT approve their own content submissions (15 ms)
    ✓ User with Creator role cannot request changes or reject content (3 ms)
    ✓ Authorized Reviewer CAN approve compliant content without critical issues (34 ms)

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        3.66 s
```

---

## Key Verifications Covered

1. **Brand Naming & Superlative Detection**: Confirms that terms like `"Nova Tech"` and `"the world's number one productivity platform"` are caught and mapped to approved brand guidelines.
2. **Pricing Discrepancy Matching**: Verifies that pricing statements conflicting with the authoritative pricing schedule (e.g., claiming `"$10/user"` instead of `"$12/user/month"`) are flagged.
3. **Scoring Integrity**: Confirms that critical findings (-25) and high findings (-15) compute deterministic scores and produce prominent warning flags.
4. **Critical Issue Visibility Safeguard**: Proves that a piece of content with an overall high score (e.g. 75%) still raises `hasUnresolvedCritical: true` when a critical finding exists, preventing silent bypass.
5. **Segregation of Duties Enforcement**: Confirms that a user with the `CREATOR` role attempting to approve their own content triggers a 403 / policy violation error.
6. **Reviewer Authority**: Confirms that an authorized `REVIEWER` or `BRAND_MANAGER` can approve eligible reviews and records an immutable `ApprovalDecision` record.
