import { RatingRepository } from '../repository/rating.repository'
import type { RatingState } from '../types/rating'

/**
 * The single public entry point for the rating system.
 *
 * Owns the RatingRepository and delegates all rating operations to it.
 * Application consumers import `ratingService` (the singleton below) and
 * never reference the repository directly.
 *
 * This class exists as the future integration point for:
 *   - Cache staleness checks and TTL-based invalidation
 *   - Incremental match processing (patch one match without full rebuild)
 *   - Event-driven or background rebuilds triggered by new match records
 *   - Read-through caching in getPlayerRating / getPlayersRatings
 *   - Persistence hooks if computed ratings are ever stored
 *
 * None of those features exist yet. Adding them requires changing only this
 * file — the public API (method signatures, return types) remains stable
 * and all callers keep working without modification.
 *
 * Constructor injection:
 *   The `repository` parameter defaults to a fresh RatingRepository, so the
 *   singleton works with no configuration. Pass a custom instance in tests
 *   or dependency-injection contexts to substitute a mock.
 */
export class RatingService {
  private readonly repository: RatingRepository

  /**
   * In-flight rebuild Promise, or null when no rebuild is running.
   *
   * Single-flight guard: concurrent callers share this Promise rather than
   * each starting an independent replay. Cleared in the `.finally()` callback
   * so the next caller after completion always begins a fresh rebuild.
   */
  private _rebuilding: Promise<void> | null = null

  /**
   * True once at least one rebuild has completed successfully.
   * Never reset to false — once the service has valid data, it remains valid
   * until replaced by a subsequent successful rebuild.
   */
  private _initialized = false

  constructor(repository = new RatingRepository()) {
    this.repository = repository
  }

  /**
   * Rebuilds all player ratings by replaying the full match history.
   *
   * Single-flight: if a rebuild is already in progress, returns the existing
   * Promise instead of starting a second replay. Both callers resolve (or
   * reject) together when the single underlying operation completes.
   *
   * Must complete before getPlayerRating or getPlayersRatings return
   * meaningful values. Callers that render rating-dependent UI should
   * await this before mounting those components.
   *
   * Future: add staleness detection, debouncing, or event subscriptions
   * inside this method without touching the signature or callers.
   *
   * @throws {Error} if the underlying Supabase query fails.
   */
  async rebuildRatings(): Promise<void> {
    this._rebuilding ??= this.repository.rebuildRatings()
      .then(() => {
        this._initialized = true
      })
      .finally(() => {
        this._rebuilding = null
      })
    return this._rebuilding
  }

  /**
   * Returns true once at least one rebuild has completed successfully.
   * Safe to call at any time; never triggers side effects.
   */
  isInitialized(): boolean {
    return this._initialized
  }

  /**
   * Resolves when the service has valid rating data.
   *
   * Behaviour by state:
   *   - Already initialized            → resolves immediately
   *   - Rebuild in progress            → awaits its completion, then resolves
   *   - No rebuild started or running  → resolves immediately (no data to wait for)
   *
   * This method never triggers a rebuild. It is a passive observer of the
   * bootstrap lifecycle, not a participant in it. Use rebuildRatings() from
   * a controlled entry point to initiate a rebuild.
   *
   * @throws {Error} if the in-flight rebuild fails (propagated from the
   *   rebuild Promise). Callers should handle this case.
   */
  waitUntilReady(): Promise<void> {
    if (this._initialized)        return Promise.resolve()
    if (this._rebuilding !== null) return this._rebuilding
    return Promise.resolve()
  }

  /**
   * Returns the current RatingState for a single player.
   *
   * Returns the default initial state (INITIAL_MU, INITIAL_SIGMA, n=0)
   * when the player has no recorded matches or rebuildRatings() has not
   * been called.
   *
   * Future: add read-through cache, TTL expiry check, or partial hydration
   * inside this method without changing callers.
   */
  getPlayerRating(playerId: string): RatingState {
    return this.repository.getPlayerRating(playerId)
  }

  /**
   * Returns a Map of RatingState for the given player IDs.
   *
   * The returned Map contains exactly one entry per requested ID.
   * Players with no recorded matches receive the default initial state.
   *
   * Future: add batch cache lookups or priority loading here.
   */
  getPlayersRatings(playerIds: string[]): Map<string, RatingState> {
    return this.repository.getPlayersRatings(playerIds)
  }
}

/**
 * Application-wide singleton.
 *
 * Import and use this everywhere outside the rating feature.
 * The class is exported only for testing and DI contexts.
 */
export const ratingService = new RatingService()
