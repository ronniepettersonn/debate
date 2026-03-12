import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const topicSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  summary: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  telegraphPath: z.string().nullable().optional(),
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

    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.topic.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const topic = await prisma.topic.create({
      data: {
        title: data.title,
        slug,
        category: data.category,
        summary: data.summary ?? null,
        tags: data.tags,
        contentType: "telegraph",
        telegraphPath: data.telegraphPath ?? null,
        //content: null,
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