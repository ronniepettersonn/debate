export type TopicCategory =
  | "Versículos"
  | "Reformadores"
  | "Fontes Gnósticas"
  | "Notas Históricas";

export type TopicBlock =
  | {
    type: "tese";
    title: string;
    content: string;
  }
  | {
    type: "citacao";
    title: string;
    quote: string;
    reference: string;
    url?: string;
  }
  | {
    type: "lista";
    title: string;
    items: string[];
  };

export type Topic = {
  id: string;
  slug: string;
  title: string;
  category: TopicCategory;
  summary: string;
  tags: string[];
  updatedAt: string;
  blocks: TopicBlock[];
  telegraphPath?: string;
};

export const TOPICS: Topic[] = [
  {
    id: "t1",
    slug: "romanos-9-eleicao",
    title: "Romanos 9 e Eleição",
    category: "Versículos",
    summary:
      "Análise contextual de Romanos 9 dentro da argumentação paulina.",
    tags: ["Romanos 9", "eleição", "contexto"],
    updatedAt: "2026-02-25",
    blocks: [
      {
        type: "tese",
        title: "Tese apresentada no debate",
        content:
          "O argumento de Paulo em Romanos 9 deve ser entendido dentro do contexto maior da epístola, especialmente à luz dos capítulos 10 e 11."
      },
      {
        type: "citacao",
        title: "Texto Bíblico",
        quote:
          "Assim, pois, isto não depende do que quer ou do que corre, mas de Deus, que se compadece.",
        reference: "Romanos 9:16"
      },
      {
        type: "lista",
        title: "Pontos de Observação",
        items: [
          "Contexto imediato da carta",
          "Audiência judaica",
          "Continuidade argumentativa até Romanos 11"
        ]
      }
    ]
  },
  {
    id: "t_otavio",
    slug: "otavio-minucio-felix",
    title: "Otávio de Minúcio Félix",
    category: "Notas Históricas",
    summary: "Texto via Telegraph para teste de renderização e formatação.",
    tags: ["patrística", "Minúcio Félix", "Otávio"],
    updatedAt: "2026-02-26",
    telegraphPath: "Otávio-de-Minúcio-Félix-02-26",
  }
];