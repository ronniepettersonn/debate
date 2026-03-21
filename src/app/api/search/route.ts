import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeText(value: string | null) {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value: string | null) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  const normalizedText = normalizeText(text);
  return normalizedText.slice(0, radius * 2).trim();
}

function isSingleWordQuery(query: string) {
  return !query.includes(" ");
}

function extractWordTokens(text: string) {
  const tokens: Array<{
    raw: string;
    normalized: string;
    start: number;
    end: number;
  }> = [];

  const regex = /[\p{L}\p{N}]+/gu;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;

    tokens.push({
      raw,
      normalized: normalizeForComparison(raw),
      start,
      end,
    });

    if (match.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }
  }

  return tokens;
}

function splitQueryIntoTokens(query: string) {
  return extractWordTokens(query).map((token) => token.normalized);
}

function findSingleWordOccurrences(text: string | null, query: string, radius = 140) {
  if (!text) return [];

  const normalizedText = normalizeText(text);
  if (!normalizedText) return [];

  const normalizedQuery = normalizeForComparison(query);
  const tokens = extractWordTokens(normalizedText);

  const occurrences: Array<{
    occurrenceIndex: number;
    excerpt: string;
    fragmentId: string;
    start: number;
    end: number;
    matchText: string;
  }> = [];

  let occurrenceIndex = 0;

  for (const token of tokens) {
    if (token.normalized !== normalizedQuery) continue;

    occurrenceIndex += 1;

    occurrences.push({
      occurrenceIndex,
      excerpt: buildExcerptFromIndex(
        normalizedText,
        token.start,
        token.raw.length,
        radius
      ),
      fragmentId: `search-${slugify(query)}-${occurrenceIndex}`,
      start: token.start,
      end: token.end,
      matchText: token.raw,
    });
  }

  return occurrences;
}

function findPhraseOccurrences(text: string | null, query: string, radius = 140) {
  if (!text) return [];

  const normalizedText = normalizeText(text);
  if (!normalizedText) return [];

  const textTokens = extractWordTokens(normalizedText);
  const queryTokens = splitQueryIntoTokens(query);

  if (!queryTokens.length) return [];

  const occurrences: Array<{
    occurrenceIndex: number;
    excerpt: string;
    fragmentId: string;
    start: number;
    end: number;
    matchText: string;
  }> = [];

  let occurrenceIndex = 0;

  for (let i = 0; i <= textTokens.length - queryTokens.length; i += 1) {
    let matched = true;

    for (let j = 0; j < queryTokens.length; j += 1) {
      if (textTokens[i + j].normalized !== queryTokens[j]) {
        matched = false;
        break;
      }
    }

    if (!matched) continue;

    const start = textTokens[i].start;
    const end = textTokens[i + queryTokens.length - 1].end;
    const matchText = normalizedText.slice(start, end);

    occurrenceIndex += 1;

    occurrences.push({
      occurrenceIndex,
      excerpt: buildExcerptFromIndex(normalizedText, start, end - start, radius),
      fragmentId: `search-${slugify(query)}-${occurrenceIndex}`,
      start,
      end,
      matchText,
    });
  }

  return occurrences;
}

function findOccurrences(text: string | null, query: string, radius = 140) {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return [];

  if (isSingleWordQuery(normalizedQuery)) {
    return findSingleWordOccurrences(text, normalizedQuery, radius);
  }

  return findPhraseOccurrences(text, normalizedQuery, radius);
}

function hasExactMatch(text: string | null, query: string) {
  return findOccurrences(text, query, 0).length > 0;
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

    // Busca tudo e filtra com regra exata em memória.
    // Para o seu cenário isso garante comportamento correto.
    const topics = await prisma.topic.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        telegraphPath: true,
        youtubeUrl: true,
        updatedAt: true,
        plainTextContent: true,
        display: {
          select: {
            displayOrder: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
    });

    const results = topics
      .map((topic) => {
        const titleMatches = hasExactMatch(topic.title, query);
        const categoryMatches = hasExactMatch(topic.category, query);
        const occurrences = findOccurrences(topic.plainTextContent, query);
        const contentMatches = occurrences.length > 0;

        const fallbackExcerpt = buildFallbackExcerpt(topic.plainTextContent);
        const excerpt = occurrences[0]?.excerpt ?? fallbackExcerpt;

        return {
          id: topic.id,
          title: topic.title,
          category: topic.category,
          telegraphPath: topic.telegraphPath,
          youtubeUrl: topic.youtubeUrl,
          updatedAt: topic.updatedAt,
          displayOrder: topic.display?.displayOrder ?? null,
          excerpt,
          occurrences,
          occurrencesCount: occurrences.length,
          titleMatches,
          categoryMatches,
          contentMatches,
        };
      })
      .filter(
        (topic) =>
          topic.titleMatches ||
          topic.categoryMatches ||
          topic.contentMatches
      );

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