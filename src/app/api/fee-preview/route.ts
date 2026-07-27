import { NextRequest, NextResponse } from "next/server";
import { calculateDevFee } from "@/lib/fee";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const priceCents = Number(searchParams.get("price_cents") ?? 0);

  if (!priceCents || priceCents <= 0) {
    return NextResponse.json({ error: "price_cents is required" }, { status: 400 });
  }

  return NextResponse.json(calculateDevFee(priceCents));
}
