import { prisma } from "../../infrastructure/prisma";
import { ProviderService } from "./provider.service";

export const providerService = new ProviderService(prisma);

export {
  ProviderService,
  type MetadataProviderConfig,
} from "./provider.service";
