"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/ga";

type Props = {
    id: string;
    title: string;
    category: string;
};

export default function TrackTopicView({ id, title, category }: Props) {
    useEffect(() => {
        trackEvent("view_topic", {
            topic_id: id,
            topic_title: title,
            topic_category: category,
        });
    }, [id, title, category]);

    return null;
}