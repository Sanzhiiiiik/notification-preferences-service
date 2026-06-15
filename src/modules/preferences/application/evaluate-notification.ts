import { evaluateNotification } from '../domain/evaluator.js';
import type { EvaluationInput, EvaluationResult } from '../domain/types.js';
import { PreferenceRepository } from '../infrastructure/preference.repository.js';

export class EvaluateNotificationUseCase {
  constructor(private readonly repository = new PreferenceRepository()) {}

  async execute(input: EvaluationInput): Promise<EvaluationResult> {
    await this.repository.ensureUserExists(input.userId);

    const [defaultPreferences, userPreferences, quietHours, globalPolicies] = await Promise.all([
      this.repository.getDefaultPreferences(),
      this.repository.getUserPreferences(input.userId),
      this.repository.getQuietHours(input.userId),
      this.repository.getGlobalPolicies()
    ]);

    return evaluateNotification(input, {
      defaultPreferences,
      userPreferences,
      quietHours,
      globalPolicies
    });
  }
}
