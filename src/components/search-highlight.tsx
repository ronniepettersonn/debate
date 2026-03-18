"use client";

import { useEffect } from "react";

type SearchHighlightProps = {
    query: string;
    containerId?: string;
};

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clearHighlights(container: HTMLElement) {
    const marks = container.querySelectorAll("mark[data-search-highlight='true']");

    marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;

        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
    });
}

function highlightInTextNode(node: Text, query: string) {
    const text = node.nodeValue;
    if (!text) return false;

    const regex = new RegExp(escapeRegExp(query), "i");
    const match = text.match(regex);

    if (!match || match.index == null) return false;

    const start = match.index;
    const end = start + match[0].length;

    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);

    const mark = document.createElement("mark");
    mark.setAttribute("data-search-highlight", "true");
    mark.className = "rounded bg-gold/25 px-1 text-gold";

    range.surroundContents(mark);

    return true;
}

function highlightAll(container: HTMLElement, query: string) {
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;

                if (!parent) return NodeFilter.FILTER_REJECT;
                if (
                    ["SCRIPT", "STYLE", "MARK"].includes(parent.tagName) ||
                    parent.closest("mark[data-search-highlight='true']")
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (!node.nodeValue?.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            },
        }
    );

    const textNodes: Text[] = [];
    let currentNode: Node | null = walker.nextNode();

    while (currentNode) {
        textNodes.push(currentNode as Text);
        currentNode = walker.nextNode();
    }

    let firstMark: HTMLElement | null = null;

    for (const textNode of textNodes) {
        const text = textNode.nodeValue;
        if (!text) continue;

        const regex = new RegExp(escapeRegExp(query), "gi");
        const matches = [...text.matchAll(regex)];

        if (matches.length === 0) continue;

        const currentTextNode: Text = textNode;

        for (let i = matches.length - 1; i >= 0; i--) {
            const match = matches[i];
            if (match.index == null) continue;

            const start = match.index;
            const end = start + match[0].length;

            const range = document.createRange();
            range.setStart(currentTextNode, start);
            range.setEnd(currentTextNode, end);

            const mark = document.createElement("mark");
            mark.setAttribute("data-search-highlight", "true");
            mark.className = "rounded bg-gold/25 px-1 text-gold";

            range.surroundContents(mark);

            if (!firstMark) {
                firstMark = mark;
            }
        }
    }

    if (firstMark) {
        firstMark.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
}

export default function SearchHighlight({
    query,
    containerId = "article-content",
}: SearchHighlightProps) {
    useEffect(() => {
        if (!query.trim()) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        clearHighlights(container);
        highlightAll(container, query);
    }, [query, containerId]);

    return null;
}