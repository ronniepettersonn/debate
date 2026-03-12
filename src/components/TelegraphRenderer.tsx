import React from "react";

export type TgNode =
    | string
    | {
        tag: string;
        attrs?: Record<string, string>;
        children?: TgNode[];
    };

function isExternal(href?: string) {
    if (!href) return false;
    return /^https?:\/\//i.test(href);
}

export function renderTelegraphNode(node: TgNode, key?: React.Key): React.ReactNode {
    if (typeof node === "string") return node;

    const { tag, attrs, children } = node;
    const kids = (children ?? []).map((c, i) => renderTelegraphNode(c, i));

    switch (tag) {
        case "p":
            return (
                <p key={key} className="my-4 leading-relaxed text-text/90">
                    {kids}
                </p>
            );

        case "strong":
            return (
                <strong key={key} className="font-semibold text-text">
                    {kids}
                </strong>
            );

        case "em":
            return <em key={key}>{kids}</em>;

        case "br":
            return <br key={key} />;

        case "a": {
            const href = attrs?.href ?? "#";
            const external = isExternal(href);

            return (
                <a
                    key={key}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer noopener" : undefined}
                    className="text-gold hover:underline"
                >
                    {kids}
                </a>
            );
        }

        default:
            return <div key={key}>{kids}</div>;
    }
}

export default function TelegraphRenderer({ content }: { content: TgNode[] }) {
    return <>{content.map((n, i) => renderTelegraphNode(n, i))}</>;
}