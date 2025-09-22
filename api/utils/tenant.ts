import { isValidUUIDv7 } from "./uuid";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getTenant(clientId: string): Promise<any | false> {
  if (!isValidUUIDv7(clientId)) {
    return false;
  }

  try {
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        status_id: { not: 1 } // Exclude deleted clients
      }
    });
    if (!client) {
      return false;
    }
    return client;
  } catch (error) {
    return false;
  }

}
