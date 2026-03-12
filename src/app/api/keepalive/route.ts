import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      message: "Database keepalive successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Keepalive error:", error);
    return NextResponse.json(
      { ok: false, error: "Database keepalive failed" },
      { status: 500 }
    );
  }
}