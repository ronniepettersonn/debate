import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const updateSchema = z
  .object({
    telegraphPath: z.string().min(1, "telegraphPath é obrigatório"),
    category: z.string().min(2, "category é obrigatória"),
    displayOrder: z.coerce.number().int().min(1, "displayOrder deve ser no mínimo 1"),
    youtubeUrl: z
      .union([z.string().url("youtubeUrl inválida"), z.literal(""), z.null()])
      .optional(),
    content: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const normalizedCategory = data.category.trim().toUpperCase();
    const normalizedYoutubeUrl =
      typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : data.youtubeUrl;

    const hasYoutubeUrl =
      typeof normalizedYoutubeUrl === "string" && normalizedYoutubeUrl.length > 0;

    if (normalizedCategory === "VIDEOS" && !hasYoutubeUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["youtubeUrl"],
        message: "youtubeUrl é obrigatória quando a categoria for VIDEOS",
      });
    }

    if (normalizedCategory !== "VIDEOS" && hasYoutubeUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["youtubeUrl"],
        message: "youtubeUrl só pode ser informada quando a categoria for VIDEOS",
      });
    }
  });

const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
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

  if (!value.includes("://") && !value.startsWith("telegra.ph/") && !value.startsWith("www.telegra.ph/")) {
    const cleanedPath = value.replace(/^\/+/, "").trim();

    if (!cleanedPath) {
      throw new Error("Path do Telegraph não informado.");
    }

    return cleanedPath;
  }

  try {
    const url = value.startsWith("http://") || value.startsWith("https://")
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
    path
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      display: true,
    },
  });

  if (!topic) {
    return NextResponse.json(
      { error: "Tópico não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(topic);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const currentTopic = await prisma.topic.findUnique({
      where: { id },
      include: {
        display: true,
      },
    });

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Tópico não encontrado." },
        { status: 404 }
      );
    }

    const normalizedCategory = data.category.trim().toUpperCase();
    const normalizedTelegraphPath = normalizeTelegraphPath(data.telegraphPath);
    const normalizedYoutubeUrl =
      typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : null;

    const youtubeUrlToSave =
      normalizedCategory === "VIDEOS" && normalizedYoutubeUrl
        ? normalizedYoutubeUrl
        : null;

    const existingTopicWithSamePath = await prisma.topic.findUnique({
      where: { telegraphPath: normalizedTelegraphPath },
    });

    if (existingTopicWithSamePath && existingTopicWithSamePath.id !== id) {
      return NextResponse.json(
        { error: "Já existe outro tópico com esse telegraphPath." },
        { status: 409 }
      );
    }

    const conflictingDisplay = await prisma.topicDisplay.findFirst({
      where: {
        category: normalizedCategory,
        displayOrder: data.displayOrder,
        topicId: {
          not: id,
        },
      },
    });

    if (conflictingDisplay) {
      return NextResponse.json(
        {
          error: `Já existe um tópico na categoria ${normalizedCategory} com a ordem ${data.displayOrder}.`,
        },
        { status: 409 }
      );
    }

    const telegraphTitle = await getTelegraphTitle(normalizedTelegraphPath);

    const topic = await prisma.$transaction(async (tx) => {
      await tx.topic.update({
        where: { id },
        data: {
          telegraphPath: normalizedTelegraphPath,
          title: telegraphTitle,
          category: normalizedCategory,
          youtubeUrl: youtubeUrlToSave,
          content: data.content ?? undefined,
        },
      });

      await tx.topicDisplay.upsert({
        where: {
          topicId: id,
        },
        update: {
          category: normalizedCategory,
          displayOrder: data.displayOrder,
        },
        create: {
          topicId: id,
          category: normalizedCategory,
          displayOrder: data.displayOrder,
        },
      });

      return tx.topic.findUnique({
        where: { id },
        include: {
          display: true,
        },
      });
    });

    return NextResponse.json(topic);
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (
        error.message === "Falha ao buscar dados no Telegraph." ||
        error.message === "Não foi possível obter o título da página no Telegraph." ||
        error.message === "Informe um path ou URL válida do Telegraph." ||
        error.message === "URL inválida do Telegraph." ||
        error.message === "Path do Telegraph não informado." ||
        error.message === "telegraphPath é obrigatório."
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
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
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar tópico." },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { direction } = moveSchema.parse(body);

    const currentTopic = await prisma.topic.findUnique({
      where: { id },
      include: {
        display: true,
      },
    });

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Tópico não encontrado." },
        { status: 404 }
      );
    }

    if (!currentTopic.display) {
      return NextResponse.json(
        { error: "Esse tópico ainda não possui ordem cadastrada." },
        { status: 400 }
      );
    }

    const { category, displayOrder } = currentTopic.display;

    const neighbor = await prisma.topicDisplay.findFirst({
      where: {
        category,
        displayOrder:
          direction === "up"
            ? { lt: displayOrder }
            : { gt: displayOrder },
      },
      orderBy: {
        displayOrder: direction === "up" ? "desc" : "asc",
      },
    });

    if (!neighbor) {
      return NextResponse.json(
        {
          error:
            direction === "up"
              ? "Este tópico já está no topo da categoria."
              : "Este tópico já está na última posição da categoria.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.topicDisplay.update({
        where: { topicId: id },
        data: { displayOrder: -1 },
      });

      await tx.topicDisplay.update({
        where: { id: neighbor.id },
        data: { displayOrder },
      });

      await tx.topicDisplay.update({
        where: { topicId: id },
        data: { displayOrder: neighbor.displayOrder },
      });
    });

    const updatedTopic = await prisma.topic.findUnique({
      where: { id },
      include: {
        display: true,
      },
    });

    return NextResponse.json(updatedTopic);
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao reordenar tópico." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const currentTopic = await prisma.topic.findUnique({
      where: { id },
      include: {
        display: true,
      },
    });

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Tópico não encontrado." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (currentTopic.display) {
        await tx.topicDisplay.delete({
          where: { topicId: id },
        });

        await tx.topicDisplay.updateMany({
          where: {
            category: currentTopic.display.category,
            displayOrder: {
              gt: currentTopic.display.displayOrder,
            },
          },
          data: {
            displayOrder: {
              decrement: 1,
            },
          },
        });
      }

      await tx.topic.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir tópico." },
      { status: 400 }
    );
  }
}