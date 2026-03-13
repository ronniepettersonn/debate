import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const topicSchema = z.object({
  telegraphPath: z.string().min(1, "telegraphPath é obrigatório"),
  category: z.string().min(2, "category é obrigatória"),
  content: z.any().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const topics = await prisma.topic.findMany({
    orderBy: { updatedAt: "desc" },
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
    const normalizedTelegraphPath = data.telegraphPath.trim();

    const existingTopic = await prisma.topic.findUnique({
      where: { telegraphPath: normalizedTelegraphPath },
    });

    if (existingTopic) {
      return NextResponse.json(
        { error: "Já existe um tópico com esse telegraphPath." },
        { status: 409 }
      );
    }

    const topic = await prisma.topic.create({
      data: {
        telegraphPath: normalizedTelegraphPath,
        category: normalizedCategory,
        content: data.content ?? undefined,
      },
    });

    return NextResponse.json(topic, { status: 201 });
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
      { error: "Erro ao criar tópico." },
      { status: 400 }
    );
  }
}