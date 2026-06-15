import { resolveEffectivePreferences } from '../domain/preference-resolver.js';
import type { EffectivePreferenceRule, QuietHours } from '../domain/types.js';
import { PreferenceRepository } from '../infrastructure/preference.repository.js';

export interface GetUserPreferencesResult {
  userId: string;
  preferences: EffectivePreferenceRule[];
  quietHours: QuietHours | null;
}

export class GetUserPreferencesUseCase {
  constructor(private readonly repository = new PreferenceRepository()) {}

  async execute(userId: string): Promise<GetUserPreferencesResult> {
    await this.repository.ensureUserExists(userId);

    const [defaultPreferences, userPreferences, quietHours] = await Promise.all([
      this.repository.getDefaultPreferences(),
      this.repository.getUserPreferences(userId),
      this.repository.getQuietHours(userId)
    ]);

    return {
      userId,
      preferences: resolveEffectivePreferences({
        defaultPreferences,
        userPreferences
      }),
      quietHours
    };
  }
}
