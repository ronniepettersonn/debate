import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const topicSchema = z.object({
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

    const topic = await prisma.topic.create({
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

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar tópico." },
      { status: 400 }
    );
  }
}