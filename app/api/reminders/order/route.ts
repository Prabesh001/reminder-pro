import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reminder from "@/models/Reminder";
import { getUserIdFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderUpdates } = await req.json();

    if (!Array.isArray(orderUpdates)) {
      return NextResponse.json(
        { error: "Invalid order updates" },
        { status: 400 }
      );
    }

    // Update each reminder's order
    const updatePromises = orderUpdates.map(({ id, order }: { id: string; order: number }) =>
      Reminder.findOneAndUpdate(
        { _id: id, userId },
        { order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    return NextResponse.json(
      { message: "Order updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

