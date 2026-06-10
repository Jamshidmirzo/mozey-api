---
name: project-flutter-offline-sync
description: Sprint 3 Flutter offline-first sync migration — Drift DB, API client, SyncManager, ConnectivityService, SyncScheduler
metadata:
  type: project
---

Sprint 3 Flutter offline-first sync layer implemented on 2026-05-19.

**What was done:**
- Migrated data storage from SharedPreferences to Drift (SQLite) for museums, historical places, photos, and pending actions
- Created ApiClient (Dio) for backend communication with JWT auth interceptor
- Created SyncManager with pull sync (content) and push sync (user actions) strategies
- Created ConnectivityService (connectivity_plus) and SyncScheduler (app start, resume, network change, 30-min timer)
- All 11 existing use cases keep the same API — only MuseumLocalDatasources constructor changed (now takes DriftMuseumLocalDatasource instead of LocalConfig)

**Why:** Transforming static app into offline-first sync-capable app per Stage 2 spec. Server becomes source of truth for content; client actions are append-only with clientEventId for idempotency.

**How to apply:** Any further Flutter changes must read from Drift DB for UI, use SyncManager for network sync, and create pending_actions for like/save. The database.g.dart is a handwritten stub — run `dart run build_runner build` to generate real code before compiling.

**Key files (in /Users/jamshidmirzo/Desktop/Projects/ozbekiston_museylari/):**
- lib/core/database/database.dart — Drift tables + AppDatabase methods
- lib/core/database/database.g.dart — Stub (needs build_runner)
- lib/core/network/api_client.dart — Dio HTTP client
- lib/core/network/api_models.dart — API response/request models
- lib/core/sync/sync_manager.dart — Pull/push sync logic
- lib/core/sync/connectivity_service.dart — Network monitoring
- lib/core/sync/sync_scheduler.dart — Sync trigger orchestration
- lib/features/home/data/datasources/drift_museum_local_datasource.dart — Drift-based datasource
- lib/features/home/data/datasources/museum_local_datasources.dart — Facade delegating to Drift
- lib/service_locator.dart — Updated DI with all new singletons
