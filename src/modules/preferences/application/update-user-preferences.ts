import type { Channel, NotificationType, QuietHours } from '../domain/types.js';
import { PreferenceRepository } from '../infrastructure/preference.repository.js';
import { GetUserPreferencesUseCase, type GetUserPreferencesResult } from './get-user-preferences.js';

export interface PreferenceUpdateCommand {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface UpdateUserPreferencesCommand {
  userId: string;
  preferences?: PreferenceUpdateCommand[];
  quietHours?: QuietHours;
}

export class UpdateUserPreferencesUseCase {
  constructor(
    private readonly repository = new PreferenceRepository(),
    private readonly getUserPreferences = new GetUserPreferencesUseCase(repository)
  ) {}

  async execute(command: UpdateUserPreferencesCommand): Promise<GetUserPreferencesResult> {
    await this.repository.ensureUserExists(command.userId);

    for (const preference of command.preferences ?? []) {
      await this.repository.upsertUserPreference({
        userId: command.userId,
        notificationType: preference.notificationType,
        channel: preference.channel,
        enabled: preference.enabled
      });
    }

    if (command.quietHours) {
      await this.repository.upsertQuietHours({
        userId: command.userId,
        enabled: command.quietHours.enabled,
        start: command.quietHours.start,
        end: command.quietHours.end,
        timezone: command.quietHours.timezone
      });
    }

    return this.getUserPreferences.execute(command.userId);
  }
}
