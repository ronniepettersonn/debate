import { prisma } from "@/lib/prisma";
import ModoPalcoClient from "./ModoPalcoClient";

export default async function ModoPalcoPage() {
    const topics = await prisma.topic.findMany({
        where: {
            published: true,
        },
        orderBy: {
            updatedAt: "desc",
        },
        select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            tags: true,
            updatedAt: true,
        },
    });

    const serializedTopics = topics.map((topic) => ({
        ...topic,
        updatedAt: topic.updatedAt.toISOString(),
    }));

    return <ModoPalcoClient topics={serializedTopics} />;
}