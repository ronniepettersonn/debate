import React from "react";

type TgNode =
    | string
    | {
        tag: string;
        attrs?: Record<string, string>;
        children?: TgNode[];
    };

function cx(...classes: Array<string | false | undefined | null>) {
    return classes.filter(Boolean).join(" ");
}

function isExternal(href?: string) {
    if (!href) return false;
    return /^https?:\/\//i.test(href);
}

export function renderTelegraphNode(node: TgNode, key?: React.Key): React.ReactNode {
    if (node == null) return null;
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

        case "br":
            return <br key={key} />;

        case "hr":
            return <hr key={key} className="my-8 border-border/70" />;

        case "strong":
            return (
                <strong key={key} className="font-semibold text-text">
                    {kids}
                </strong>
            );

        case "em":
            return (
                <em key={key} className="italic">
                    {kids}
                </em>
            );

        case "u":
            return (
                <u key={key} className="underline underline-offset-4">
                    {kids}
                </u>
            );

        case "s":
            return <s key={key}>{kids}</s>;

        case "a": {
            const href = attrs?.href ?? "#";
            const external = isExternal(href);
            return (
                <a
                    key={key}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer noopener" : undefined}
                    className="text-gold hover:underline underline-offset-4"
                >
                    {kids}
                </a>
            );
        }

        case "blockquote":
        case "aside":
            return (
                <blockquote
                    key={key}
                    className="my-5 rounded-2xl border border-border bg-panel/35 p-5 text-text/90"
                >
                    <div className="border-l-2 border-gold pl-4 leading-relaxed">{kids}</div>
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
                <ol key={key} className="my-4 list-decimal space-y-2 pl-6 text-text/90">
                    {kids}
                </ol>
            );

        case "li":
            return <li key={key} className="leading-relaxed">{kids}</li>;

        case "figure":
            return (
                <figure key={key} className="my-6">
                    {kids}
                </figure>
            );

        case "img": {
            const src = attrs?.src;
            const alt = attrs?.alt ?? "";
            if (!src) return null;
            return (
                // Telegraph geralmente fornece URLs absolutas/relativas (funciona como <img />)
                <img
                    key={key}
                    src={src}
                    alt={alt}
                    className="max-h-[520px] w-full rounded-2xl border border-border object-contain"
                    loading="lazy"
                />
            );
        }

        case "code":
            return (
                <code
                    key={key}
                    className="rounded bg-white/5 px-1.5 py-0.5 text-[0.95em] text-text"
                >
                    {kids}
                </code>
            );

        case "pre":
            return (
                <pre
                    key={key}
                    className="my-5 overflow-auto rounded-2xl border border-border bg-panel/35 p-5 text-sm text-text/90"
                >
                    {kids}
                </pre>
            );

        // fallback para tags desconhecidas
        default:
            return (
                <div key={key} className={cx(tag === "div" && "my-2")}>
                    {kids}
                </div>
            );
    }
}

export default function TelegraphRenderer({ content }: { content: TgNode[] }) {
    return <>{content.map((n, i) => renderTelegraphNode(n, i))}</>;
}