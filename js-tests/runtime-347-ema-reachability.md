# Runtime 347 EMA-branch reachability

Generated: 2026-08-20T07:32:11.330Z

- Clone block: 1781 (`0xf88bfd3f0c4d09d29e10455f338420674f49a49cefe12df4b92b1e798234490f`)
- Snapshot runtime: 447
- Active networks: 129
- Active alpha subnets: 128
- Stored `SubnetEmaTaoFlow` entries: 122
- Active networks without an EMA entry: 0, 58, 70, 86, 90, 99, 103
- Active alpha subnets without an EMA entry: 58, 70, 86, 90, 99, 103

Runtime 347 and 348 differ in automatic accounting only when `SubnetEmaTaoFlow::get(netuid)` returns `None`. At least one active alpha subnet can enter the differing initialization branch, so runtime 347 requires a behavioral run.
