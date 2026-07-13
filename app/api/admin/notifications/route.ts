import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const MAX_ITEMS = 10;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceParam = new URL(request.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  const divisionWhere = user.division ? { division: user.division } : {};
  const unreadWhere = {
    ...divisionWhere,
    ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}),
  };

  const [unreadCount, items] = await Promise.all([
    prisma.surveyResponse.count({ where: unreadWhere }),
    // Always the latest N, independent of `since` — the panel shows a
    // rolling recent-activity feed, not just what's arrived since last open.
    prisma.surveyResponse.findMany({
      where: divisionWhere,
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, service: true, region: true, customerType: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    serverTime: new Date().toISOString(),
  });
}
