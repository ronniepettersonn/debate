"use client";

import { useEffect } from "react";

type Props = {
    query: string;
    containerId: string;
};

function normalizeSearchTerm(value: string) {
    return value.trim().replace(/\s+/g, " ");
}

function normalizeText(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(value: string) {
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

function isSingleWordQuery(query: string) {
    return !query.includes(" ");
}

function unwrapPreviousHighlights(container: HTMLElement) {
    const marks = container.querySelectorAll("mark[data-search-highlight='true']");

    marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;

        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
    });
}

function getTextNodes(root: Node): Text[] {
    const textNodes: Text[] = [];

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;

            if (!parent) return NodeFilter.FILTER_REJECT;

            const tag = parent.tagName.toLowerCase();

            if (
                tag === "script" ||
                tag === "style" ||
                tag === "noscript" ||
                tag === "mark"
            ) {
                return NodeFilter.FILTER_REJECT;
            }

            if (!node.textContent?.trim()) {
                return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
        },
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
        textNodes.push(currentNode as Text);
        currentNode = walker.nextNode();
    }

    return textNodes;
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

function findExactMatchesInText(text: string, query: string) {
    const normalizedQuery = normalizeSearchTerm(query);
    if (!normalizedQuery) return [];

    const matches: Array<{
        start: number;
        end: number;
        matchText: string;
    }> = [];

    if (isSingleWordQuery(normalizedQuery)) {
        const normalizedSingleQuery = normalizeForComparison(normalizedQuery);
        const tokens = extractWordTokens(text);

        for (const token of tokens) {
            if (token.normalized !== normalizedSingleQuery) continue;

            matches.push({
                start: token.start,
                end: token.end,
                matchText: token.raw,
            });
        }

        return matches;
    }

    const textTokens = extractWordTokens(text);
    const queryTokens = splitQueryIntoTokens(normalizedQuery);

    if (!queryTokens.length) return [];

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

        matches.push({
            start,
            end,
            matchText: text.slice(start, end),
        });
    }

    return matches;
}

export default function SearchHighlight({ query, containerId }: Props) {
    useEffect(() => {
        const container = document.getElementById(containerId);
        if (!container) return;

        unwrapPreviousHighlights(container);

        const normalizedQuery = normalizeSearchTerm(query);
        if (!normalizedQuery) return;

        const querySlug = slugify(normalizedQuery);

        let occurrenceIndex = 0;
        const textNodes = getTextNodes(container);

        for (const textNode of textNodes) {
            const text = textNode.textContent || "";
            const matches = findExactMatchesInText(text, normalizedQuery);

            if (matches.length === 0) continue;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            for (const match of matches) {
                const { start, end, matchText } = match;

                if (start > lastIndex) {
                    fragment.appendChild(
                        document.createTextNode(text.slice(lastIndex, start))
                    );
                }

                occurrenceIndex += 1;

                const mark = document.createElement("mark");
                mark.textContent = matchText;
                mark.id = `search-${querySlug}-${occurrenceIndex}`;
                mark.setAttribute("data-search-highlight", "true");
                mark.className = "rounded bg-gold/25 px-1 text-gold";

                fragment.appendChild(mark);
                lastIndex = end;
            }

            if (lastIndex < text.length) {
                fragment.appendChild(
                    document.createTextNode(text.slice(lastIndex))
                );
            }

            textNode.parentNode?.replaceChild(fragment, textNode);
        }
    }, [query, containerId]);

    return null;
}