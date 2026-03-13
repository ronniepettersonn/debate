import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const updateSchema = z.object({
  telegraphPath: z.string().min(1, "telegraphPath é obrigatório"),
  category: z.string().min(2, "category é obrigatória"),
  content: z.any().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id },
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
    });

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Tópico não encontrado." },
        { status: 404 }
      );
    }

    const normalizedCategory = data.category.trim().toUpperCase();
    const normalizedTelegraphPath = data.telegraphPath.trim();

    const existingTopicWithSamePath = await prisma.topic.findUnique({
      where: { telegraphPath: normalizedTelegraphPath },
    });

    if (
      existingTopicWithSamePath &&
      existingTopicWithSamePath.id !== id
    ) {
      return NextResponse.json(
        { error: "Já existe outro tópico com esse telegraphPath." },
        { status: 409 }
      );
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        telegraphPath: normalizedTelegraphPath,
        category: normalizedCategory,
        content: data.content ?? undefined,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
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
      { error: "Erro ao atualizar tópico." },
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
    });

    if (!currentTopic) {
      return NextResponse.json(
        { error: "Tópico não encontrado." },
        { status: 404 }
      );
    }

    await prisma.topic.delete({
      where: { id },
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