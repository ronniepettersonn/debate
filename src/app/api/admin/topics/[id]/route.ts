import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit-log";

const updateSchema = z
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

const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

type TelegraphNode = {
  tag?: string;
  attrs?: Record<string, string>;
  children?: Array<TelegraphNode | string>;
};

type TelegraphResponse = {
  ok: boolean;
  result?: {
    title?: string;
    content?: TelegraphNode[];
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

function extractTextFromNode(node: TelegraphNode | string): string {
  if (typeof node === "string") {
    return node;
  }

  if (node.tag === "br") {
    return "\n";
  }

  if (!node || !Array.isArray(node.children)) {
    return "";
  }

  const text = node.children.map(extractTextFromNode).join(" ");

  if (["p", "h3", "h4", "blockquote", "figcaption"].includes(node.tag ?? "")) {
    return `${text}\n`;
  }

  return text;
}

function extractPlainText(content: TelegraphNode[]): string {
  return content
    .map(extractTextFromNode)
    .join(" ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getTelegraphPage(path: string, returnContent = false) {
  const url = `https://api.telegra.ph/getPage/${encodeURIComponent(
    path,
  )}?return_content=${returnContent ? "true" : "false"}`;

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

  return {
    title: data.result.title.trim(),
    content: Array.isArray(data.result.content) ? data.result.content : [],
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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
      { status: 404 },
    );
  }

  return NextResponse.json(topic);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
        { status: 404 },
      );
    }

    const normalizedCategory = data.category.trim().toUpperCase();

    const rawTelegraphPath =
      typeof data.telegraphPath === "string" ? data.telegraphPath.trim() : "";

    const normalizedTelegraphPath =
      rawTelegraphPath.length > 0
        ? normalizeTelegraphPath(rawTelegraphPath)
        : null;

    const normalizedYoutubeUrl =
      typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : null;

    const youtubeUrlToSave =
      normalizedCategory === "VIDEOS" && normalizedYoutubeUrl
        ? normalizedYoutubeUrl
        : null;

    if (normalizedTelegraphPath) {
      const existingTopicWithSamePath = await prisma.topic.findUnique({
        where: { telegraphPath: normalizedTelegraphPath },
      });

      if (existingTopicWithSamePath && existingTopicWithSamePath.id !== id) {
        return NextResponse.json(
          { error: "Já existe outro tópico com esse telegraphPath." },
          { status: 409 },
        );
      }
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
        { status: 409 },
      );
    }

    let telegraphTitle: string | null = null;
    let telegraphContent: TelegraphNode[] | typeof Prisma.JsonNull = Prisma.JsonNull;
    let plainTextContent: string | null = null;

    if (normalizedTelegraphPath) {
      const page = await getTelegraphPage(normalizedTelegraphPath, true);
      telegraphTitle = page.title;
      telegraphContent = page.content;
      plainTextContent = extractPlainText(page.content);
    }

    const topic = await prisma.$transaction(async (tx) => {
      const oldDisplay = currentTopic.display;

      await tx.topic.update({
        where: { id },
        data: {
          telegraphPath: normalizedTelegraphPath,
          title: telegraphTitle,
          category: normalizedCategory,
          youtubeUrl: youtubeUrlToSave,
          content: telegraphContent,
          plainTextContent,
        },
      });

      const upsertedDisplay = await tx.topicDisplay.upsert({
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

      const fullUpdatedTopic = await tx.topic.findUnique({
        where: { id },
        include: {
          display: true,
        },
      });

      await createAuditLog(tx, {
        action: "UPDATE",
        entity: "Topic",
        entityId: id,
        description: "Tópico atualizado",
        oldData: currentTopic,
        newData: fullUpdatedTopic,
      });

      await createAuditLog(tx, {
        action: oldDisplay ? "UPDATE" : "CREATE",
        entity: "TopicDisplay",
        entityId: upsertedDisplay.id,
        description: oldDisplay
          ? "Display do tópico atualizado"
          : "Display do tópico criado",
        oldData: oldDisplay,
        newData: upsertedDisplay,
      });

      return fullUpdatedTopic;
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
      { error: "Erro ao atualizar tópico." },
      { status: 400 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
        { status: 404 },
      );
    }

    if (!currentTopic.display) {
      return NextResponse.json(
        { error: "Esse tópico ainda não possui ordem cadastrada." },
        { status: 400 },
      );
    }

    const { category, displayOrder } = currentTopic.display;

    const neighbor = await prisma.topicDisplay.findFirst({
      where: {
        category,
        displayOrder:
          direction === "up" ? { lt: displayOrder } : { gt: displayOrder },
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
        { status: 400 },
      );
    }

    const oldState = {
      topicId: currentTopic.id,
      category: currentTopic.display.category,
      displayOrder: currentTopic.display.displayOrder,
    };

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

      const updatedDisplay = await tx.topicDisplay.findUnique({
        where: { topicId: id },
      });

      await createAuditLog(tx, {
        action: "REORDER",
        entity: "TopicDisplay",
        entityId: currentTopic.display?.id ?? null,
        description: `Tópico movido ${direction} na categoria ${category}`,
        oldData: oldState,
        newData: updatedDisplay,
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
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao reordenar tópico." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const oldDisplay = currentTopic.display;

      if (currentTopic.display) {
        await tx.topicDisplay.delete({
          where: { topicId: id },
        });

        await createAuditLog(tx, {
          action: "DELETE",
          entity: "TopicDisplay",
          entityId: oldDisplay?.id ?? null,
          description: `Display removido do tópico ${id}`,
          oldData: oldDisplay,
          newData: null,
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

      await createAuditLog(tx, {
        action: "DELETE",
        entity: "Topic",
        entityId: id,
        description: "Tópico removido",
        oldData: currentTopic,
        newData: null,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir tópico." },
      { status: 400 },
    );
  }
}