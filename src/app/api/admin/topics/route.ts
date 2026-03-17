import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

import { createAuditLog } from "@/lib/audit-log";

const topicSchema = z
  .object({
    telegraphPath: z.union([z.string(), z.literal(""), z.null()]).optional(),
    category: z.string().min(2, "category é obrigatória"),
    displayOrder: z.coerce
      .number()
      .int()
      .min(1, "displayOrder deve ser no mínimo 1"),
    youtubeUrl: z
      .union([z.string().url("youtubeUrl inválida"), z.literal(""), z.null()])
      .optional(),
    content: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const normalizedCategory = data.category.trim().toUpperCase();

    const normalizedTelegraphPath =
      typeof data.telegraphPath === "string" ? data.telegraphPath.trim() : "";

    const normalizedYoutubeUrl =
      typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : "";

    const hasTelegraphPath = normalizedTelegraphPath.length > 0;
    const hasYoutubeUrl = normalizedYoutubeUrl.length > 0;

    if (normalizedCategory === "VIDEOS" && !hasYoutubeUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["youtubeUrl"],
        message: "youtubeUrl é obrigatória quando a categoria for VIDEOS",
      });
    }

    if (normalizedCategory !== "VIDEOS" && !hasTelegraphPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telegraphPath"],
        message:
          "telegraphPath é obrigatório quando a categoria não for VIDEOS",
      });
    }
  });

type TelegraphResponse = {
  ok: boolean;
  result?: {
    title?: string;
  };
};

function normalizeTelegraphPath(input: string) {
  const value = input.trim();

  if (!value) {
    throw new Error("telegraphPath é obrigatório.");
  }

  if (
    !value.includes("://") &&
    !value.startsWith("telegra.ph/") &&
    !value.startsWith("www.telegra.ph/")
  ) {
    const cleanedPath = value.replace(/^\/+/, "").trim();

    if (!cleanedPath) {
      throw new Error("Path do Telegraph não informado.");
    }

    return cleanedPath;
  }

  try {
    const url =
      value.startsWith("http://") || value.startsWith("https://")
        ? new URL(value)
        : new URL(`https://${value}`);

    if (!["telegra.ph", "www.telegra.ph"].includes(url.hostname)) {
      throw new Error("URL inválida do Telegraph.");
    }

    const cleanedPath = url.pathname.replace(/^\/+/, "").trim();

    if (!cleanedPath) {
      throw new Error("Path do Telegraph não informado.");
    }

    return cleanedPath;
  } catch {
    throw new Error("Informe um path ou URL válida do Telegraph.");
  }
}

async function getTelegraphTitle(path: string) {
  const url = `https://api.telegra.ph/getPage/${encodeURIComponent(
    path,
  )}?return_content=false`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Falha ao buscar dados no Telegraph.");
  }

  const data: TelegraphResponse = await res.json();

  if (!data.ok || !data.result?.title?.trim()) {
    throw new Error("Não foi possível obter o título da página no Telegraph.");
  }

  return data.result.title.trim();
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const topics = await prisma.topic.findMany({
    include: {
      display: true,
    },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(topics);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const data = topicSchema.parse(body);

    const normalizedCategory = data.category.trim().toUpperCase();

    const rawTelegraphPath =
      typeof data.telegraphPath === "string" ? data.telegraphPath.trim() : "";

    const normalizedYoutubeUrl =
      typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : null;

    const normalizedTelegraphPath =
      rawTelegraphPath.length > 0
        ? normalizeTelegraphPath(rawTelegraphPath)
        : null;

    const youtubeUrlToSave =
      normalizedCategory === "VIDEOS" && normalizedYoutubeUrl
        ? normalizedYoutubeUrl
        : null;

    if (normalizedTelegraphPath) {
      const existingTopic = await prisma.topic.findUnique({
        where: { telegraphPath: normalizedTelegraphPath },
      });

      if (existingTopic) {
        return NextResponse.json(
          { error: "Já existe um tópico com esse telegraphPath." },
          { status: 409 },
        );
      }
    }

    const conflictingDisplay = await prisma.topicDisplay.findFirst({
      where: {
        category: normalizedCategory,
        displayOrder: data.displayOrder,
      },
    });

    if (conflictingDisplay) {
      return NextResponse.json(
        {
          error: `Já existe um tópico na categoria ${normalizedCategory} com a ordem ${data.displayOrder}.`,
        },
        { status: 409 },
      );
    }

    const telegraphTitle = normalizedTelegraphPath
      ? await getTelegraphTitle(normalizedTelegraphPath)
      : null;

    const topic = await prisma.$transaction(async (tx) => {
      const createdTopic = await tx.topic.create({
        data: {
          telegraphPath: normalizedTelegraphPath,
          title: telegraphTitle,
          category: normalizedCategory,
          youtubeUrl: youtubeUrlToSave,
          content: data.content ?? undefined,
        },
      });

      const createdDisplay = await tx.topicDisplay.create({
        data: {
          topicId: createdTopic.id,
          category: normalizedCategory,
          displayOrder: data.displayOrder,
        },
      });

      const fullTopic = await tx.topic.findUnique({
        where: { id: createdTopic.id },
        include: {
          display: true,
        },
      });

      await createAuditLog(tx, {
        action: "CREATE",
        entity: "Topic",
        entityId: createdTopic.id,
        description: `Tópico criado na categoria ${normalizedCategory}`,
        oldData: null,
        newData: fullTopic,
      });

      await createAuditLog(tx, {
        action: "CREATE",
        entity: "TopicDisplay",
        entityId: createdDisplay.id,
        description: `Ordem ${data.displayOrder} criada para o tópico ${createdTopic.id}`,
        oldData: null,
        newData: createdDisplay,
      });

      return fullTopic;
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (
        error.message === "Falha ao buscar dados no Telegraph." ||
        error.message ===
          "Não foi possível obter o título da página no Telegraph." ||
        error.message === "Informe um path ou URL válida do Telegraph." ||
        error.message === "URL inválida do Telegraph." ||
        error.message === "Path do Telegraph não informado." ||
        error.message === "telegraphPath é obrigatório."
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um registro com esses dados únicos." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar tópico." },
      { status: 400 },
    );
  }
}
