import "dotenv/config";
import { prisma } from "@/lib/prisma";

type TelegraphNode = {
  tag?: string;
  attrs?: Record<string, string>;
  children?: Array<TelegraphNode | string>;
};

type TgResponse = {
  ok: boolean;
  result?: {
    title: string;
    author_name?: string;
    url: string;
    content: TelegraphNode[];
  };
};

async function getTelegraphPage(path: string) {
  const url = `https://api.telegra.ph/getPage/${encodeURIComponent(
    path
  )}?return_content=true`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Telegraph respondeu com status ${res.status}`);
  }

  const data: TgResponse = await res.json();

  if (!data.ok || !data.result) {
    throw new Error("Falha ao buscar página no Telegraph");
  }

  return data.result;
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

function isContentEmpty(content: unknown): boolean {
  if (content == null) return true;
  if (Array.isArray(content) && content.length === 0) return true;
  return false;
}

function isPlainTextEmpty(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

async function main() {
  let processed = 0;
  let success = 0;
  let failed = 0;

  const topics = await prisma.topic.findMany({
    where: {
      telegraphPath: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      telegraphPath: true,
      content: true,
      plainTextContent: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const pendingTopics = topics.filter((topic) => {
    return (
      isContentEmpty(topic.content) ||
      isPlainTextEmpty(topic.plainTextContent)
    );
  });

  console.log(`Encontrados ${pendingTopics.length} tópico(s) pendente(s).`);

  for (const topic of pendingTopics) {
    processed++;

    try {
      if (!topic.telegraphPath) {
        console.log(`Ignorado sem telegraphPath: ${topic.id}`);
        continue;
      }

      console.log(
        `Buscando conteúdo: ${topic.title ?? "(sem título)"} [${topic.id}]`
      );

      const page = await getTelegraphPage(topic.telegraphPath);
      const plainTextContent = extractPlainText(page.content);

      await prisma.topic.update({
        where: { id: topic.id },
        data: {
          content: page.content,
          plainTextContent,
        },
      });

      success++;
      console.log(`OK: ${topic.title ?? topic.id}`);
    } catch (error) {
      failed++;
      console.error(`ERRO no tópico ${topic.id}:`, error);
    }
  }

  console.log("Backfill concluído.");
  console.log(`Total processado: ${processed}`);
  console.log(`Sucesso: ${success}`);
  console.log(`Falhas: ${failed}`);
}

main()
  .catch((error) => {
    console.error("Erro geral no backfill:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });