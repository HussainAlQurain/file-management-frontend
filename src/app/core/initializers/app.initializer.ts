import { ConfigService } from '../services/config.service';

export function appInitializer(configService: ConfigService): () => Promise<void> {
  return () => configService.loadConfig();
}
