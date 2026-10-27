import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const items = await prisma.competitorWatchItem.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener lista de seguimiento";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemId,
      title,
      price,
      currencyId,
      soldQuantity,
      stock,
      permalink,
      thumbnail,
      sellerId,
      sellerNickname,
      categoryName,
      notes,
    } = body;

    if (!itemId || !title) {
      return NextResponse.json({ success: false, error: "itemId y title son requeridos" }, { status: 400 });
    }

    const item = await prisma.competitorWatchItem.upsert({
      where: { itemId },
      update: {
        title,
        price: Number(price) || 0,
        currencyId: currencyId || "ARS",
        soldQuantity: Number(soldQuantity) || 0,
        stock: Number(stock) || 0,
        permalink,
        thumbnail,
        sellerId: sellerId ? String(sellerId) : null,
        sellerNickname,
        categoryName,
        notes,
        updatedAt: new Date(),
      },
      create: {
        itemId,
        title,
        price: Number(price) || 0,
        currencyId: currencyId || "ARS",
        soldQuantity: Number(soldQuantity) || 0,
        stock: Number(stock) || 0,
        permalink,
        thumbnail,
        sellerId: sellerId ? String(sellerId) : null,
        sellerNickname,
        categoryName,
        notes,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al guardar en lista de seguimiento";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const itemId = searchParams.get("itemId");

    if (!id && !itemId) {
      return NextResponse.json({ success: false, error: "Debes proveer id o itemId" }, { status: 400 });
    }

    if (id) {
      await prisma.competitorWatchItem.delete({ where: { id } });
    } else if (itemId) {
      await prisma.competitorWatchItem.delete({ where: { itemId } });
    }

    return NextResponse.json({ success: true, message: "Eliminado de la lista de seguimiento" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar de lista de seguimiento";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
