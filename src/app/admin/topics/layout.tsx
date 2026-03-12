import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function AdminTopicsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.role !== "admin") {
        redirect("/login");
    }

    return <>{children}</>;
}