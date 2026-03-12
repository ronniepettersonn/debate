import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const updateSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  category: z.string().min(2),
  summary: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  contentType: z.enum(["manual", "telegraph"]).default("manual"),
  telegraphPath: z.string().optional().nullable(),
  content: z.any().optional().nullable(),
  published: z.boolean().default(false),
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
    return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });
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

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        category: data.category,
        summary: data.summary ?? null,
        tags: data.tags,
        contentType: data.contentType,
        telegraphPath: data.telegraphPath ?? null,
        content: data.content ?? null,
        published: data.published,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error(error);
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