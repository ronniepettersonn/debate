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

function normalizeImageSrc(src?: string) {
    if (!src) return "";

    if (src.startsWith("//")) {
        return `https:${src}`;
    }

    if (src.startsWith("/")) {
        return `https://telegra.ph${src}`;
    }

    return src;
}

export function renderTelegraphNode(
    node: TgNode,
    key?: React.Key
): React.ReactNode {
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

        case "img": {
            const src = normalizeImageSrc(attrs?.src);
            const alt = attrs?.alt ?? "Imagem";

            if (!src) return null;

            return (
                <img
                    key={key}
                    src={src}
                    alt={alt}
                    className="my-6 w-full rounded-2xl  object-cover"
                    loading="lazy"
                />
            );
        }

        case "figure":
            return (
                <figure key={key} className="my-6">
                    {kids}
                </figure>
            );

        case "figcaption":
            return (
                <figcaption key={key} className="mt-2 text-center text-sm text-muted">
                    {kids}
                </figcaption>
            );

        case "blockquote":
            return (
                <blockquote
                    key={key}
                    className="my-6 border-l-4 border-gold/50 pl-4 italic text-text/80"
                >
                    {kids}
                </blockquote>
            );

        case "h3":
            return (
                <h3 key={key} className="mt-8 text-xl font-semibold text-gold">
                    {kids}
                </h3>
            );

        case "h4":
            return (
                <h4 key={key} className="mt-6 text-lg font-semibold text-text">
                    {kids}
                </h4>
            );

        case "ul":
            return (
                <ul key={key} className="my-4 list-disc space-y-2 pl-6 text-text/90">
                    {kids}
                </ul>
            );

        case "ol":
            return (
                <ol
                    key={key}
                    className="my-4 list-decimal space-y-2 pl-6 text-text/90"
                >
                    {kids}
                </ol>
            );

        case "aside":
            return (
                <aside
                    key={key}
                    className="italic my-6 rounded-2xl  bg-panel px-16 py-10 text-lg leading-relaxed text-muted text-center whitespace-pre-wrap"
                >
                    {kids}
                </aside>
            );

        case "li":
            return <li key={key}>{kids}</li>;

        case "u":
            return <u key={key}>{kids}</u>;

        case "hr":
            return <hr className="max-w-[50%] mx-auto my-8 border-border/50" key={key} />;

        default:
            return (
                <div key={key} className="my-2">
                    {kids}
                </div>
            );
    }
}

export default function TelegraphRenderer({
    content,
}: {
    content: TgNode[];
}) {
    return <>{content.map((n, i) => renderTelegraphNode(n, i))}</>;
}