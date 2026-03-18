import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TelegraphNode = {
  tag?: string;
  attrs?: Record<string, string>;
  children?: Array<TelegraphNode | string>;
};

type TgResponse = {
  ok: boolean;
  result?: {
    title?: string;
    content?: TelegraphNode[];
  };
};

function extractTextFromNode(node: TelegraphNode | string): string {
  if (typeof node === "string") return node;

  if (node.tag === "br") return "\n";

  if (!node || !Array.isArray(node.children)) return "";

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

async function getTelegraphPage(path: string) {
  const url = `https://api.telegra.ph/getPage/${encodeURIComponent(
    path
  )}?return_content=true`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error("Erro no Telegraph");

  const data: TgResponse = await res.json();

  if (!data.ok || !data.result?.content) {
    throw new Error("Resposta inválida do Telegraph");
  }

  return data.result;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let updated = 0;
  let checked = 0;

  const topics = await prisma.topic.findMany({
    where: {
      telegraphPath: {
        not: null,
      },
    },
    select: {
      id: true,
      telegraphPath: true,
      content: true,
    },
  });

  for (const topic of topics) {
    try {
      if (!topic.telegraphPath) continue;

      checked++;

      const page = await getTelegraphPage(topic.telegraphPath);
      const newContent = page.content ?? [];
      const newPlainText = extractPlainText(newContent);

      // comparação simples (stringify)
      const oldContent = JSON.stringify(topic.content ?? []);

      const newContentStr = JSON.stringify(newContent);

      if (oldContent !== newContentStr) {
        await prisma.topic.update({
          where: { id: topic.id },
          data: {
            content: newContent,
            plainTextContent: newPlainText,
          },
        });

        updated++;
      }
    } catch (error) {
      console.error("Erro ao sincronizar topic:", topic.id, error);
    }
  }

  return NextResponse.json({
    ok: true,
    checked,
    updated,
  });
}