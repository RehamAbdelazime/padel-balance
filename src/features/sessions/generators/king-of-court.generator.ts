/**
 * Placeholder generator for the King of the Court format.
 * The queue-based challenge algorithm (docs/tournament-formats/king-of-the-court.md)
 * is not implemented yet — every method returns a 'not-implemented' result.
 */

import type { TournamentGenerator } from './generator.interface'
import type { TournamentPlan } from '../planner'
import type { SessionSchedule } from '../types'
import type {
  GeneratorContext,
  GeneratorRegenerateScope,
  GeneratorResult,
  GeneratorValidationResult,
  GeneratorEstimate,
} from './generator.types'

export class KingOfTheCourtGenerator implements TournamentGenerator {
  readonly formatId = 'king-of-court'

  supports(formatId: string): boolean {
    return formatId === this.formatId
  }

  async generate(_plan: TournamentPlan, _context: GeneratorContext): Promise<GeneratorResult> {
    return { status: 'not-implemented', message: 'KingOfTheCourtGenerator.generate is not implemented yet.' }
  }

  async regenerate(
    _schedule: SessionSchedule,
    _plan:     TournamentPlan,
    _context:  GeneratorContext,
    _scope:    GeneratorRegenerateScope,
  ): Promise<GeneratorResult> {
    return { status: 'not-implemented', message: 'KingOfTheCourtGenerator.regenerate is not implemented yet.' }
  }

  validate(_plan: TournamentPlan, _context: GeneratorContext): GeneratorValidationResult {
    return { valid: false, errors: ['KingOfTheCourtGenerator is not implemented yet.'] }
  }

  estimate(_plan: TournamentPlan, _context: GeneratorContext): GeneratorEstimate {
    return {
      estimatedRounds:       0,
      estimatedMatches:      0,
      estimatedDuration:     { min: 0, max: 0 },
      estimatedAverageRest:  0,
      fairnessScoreEstimate: null,
    }
  }
}
