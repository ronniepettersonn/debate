import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildExcerptFromIndex(
  text: string,
  matchIndex: number,
  queryLength: number,
  radius = 140
) {
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + queryLength + radius);

  const excerpt = text.slice(start, end).trim();
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  return `${prefix}${excerpt}${suffix}`;
}

function buildFallbackExcerpt(text: string | null, radius = 140) {
  if (!text) return "";
  const normalizedText = text.replace(/\s+/g, " ").trim();
  return normalizedText.slice(0, radius * 2).trim();
}

function findOccurrences(text: string | null, query: string, radius = 140) {
  if (!text) return [];

  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) return [];

  const regex = new RegExp(escapeRegExp(query), "gi");

  const occurrences: Array<{
    occurrenceIndex: number;
    excerpt: string;
    fragmentId: string;
    start: number;
    end: number;
    matchText: string;
  }> = [];

  let match: RegExpExecArray | null;
  let occurrenceIndex = 0;

  while ((match = regex.exec(normalizedText)) !== null) {
    occurrenceIndex += 1;

    const start = match.index;
    const matchText = match[0];
    const end = start + matchText.length;

    occurrences.push({
      occurrenceIndex,
      excerpt: buildExcerptFromIndex(normalizedText, start, matchText.length, radius),
      fragmentId: `search-${slugify(query)}-${occurrenceIndex}`,
      start,
      end,
      matchText,
    });

    if (match.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }
  }

  return occurrences;
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

    const lowerQuery = query.toLowerCase();

    const results = topics.map((topic) => {
      const occurrences = findOccurrences(topic.plainTextContent, query);

      const fallbackExcerpt = buildFallbackExcerpt(topic.plainTextContent);
      const excerpt = occurrences[0]?.excerpt ?? fallbackExcerpt;

      const titleMatches = topic.title?.toLowerCase().includes(lowerQuery) ?? false;
      const categoryMatches = topic.category.toLowerCase().includes(lowerQuery);

      return {
        id: topic.id,
        title: topic.title,
        category: topic.category,
        telegraphPath: topic.telegraphPath,
        youtubeUrl: topic.youtubeUrl,
        updatedAt: topic.updatedAt,
        displayOrder: topic.display?.displayOrder ?? null,

        // mantém compatibilidade com a API antiga
        excerpt,

        // dados novos
        occurrences,
        occurrencesCount: occurrences.length,
        titleMatches,
        categoryMatches,
      };
    });

    return NextResponse.json({
      query,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao realizar busca." },
      { status: 500 }
    );
  }
}