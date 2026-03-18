import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildExcerpt(text: string | null, query: string, radius = 140) {
  if (!text) return "";

  const normalizedText = text.replace(/\s+/g, " ").trim();
  const lowerText = normalizedText.toLowerCase();
  const lowerQuery = query.toLowerCase();

  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return normalizedText.slice(0, radius * 2).trim();
  }

  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(normalizedText.length, matchIndex + query.length + radius);

  const excerpt = normalizedText.slice(start, end).trim();

  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalizedText.length ? "..." : "";

  return `${prefix}${excerpt}${suffix}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q") ?? "";
    const query = normalizeSearchTerm(rawQuery);

    if (!query) {
      return NextResponse.json({
        query: "",
        total: 0,
        results: [],
      });
    }

    const topics = await prisma.topic.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            category: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            plainTextContent: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        display: true,
      },
      orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
    });

    const results = topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      category: topic.category,
      telegraphPath: topic.telegraphPath,
      youtubeUrl: topic.youtubeUrl,
      updatedAt: topic.updatedAt,
      displayOrder: topic.display?.displayOrder ?? null,
      excerpt: buildExcerpt(topic.plainTextContent, query),
    }));

    return NextResponse.json({
      query,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao realizar busca." },
      { status: 500 },
    );
  }
}