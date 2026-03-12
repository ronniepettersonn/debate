import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }

  if (session.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}