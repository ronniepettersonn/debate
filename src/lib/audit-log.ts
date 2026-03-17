import { Prisma, PrismaClient } from "@/generated/prisma";

type AuditLogInput = {
  action: string;
  entity: string;
  entityId?: string | null;
  description?: string | null;
  oldData?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
  newData?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
};

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createAuditLog(
  db: PrismaExecutor,
  input: AuditLogInput
) {
  await db.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      description: input.description ?? null,
      oldData: input.oldData ?? Prisma.JsonNull,
      newData: input.newData ?? Prisma.JsonNull,
    },
  });
}