import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reminder from "@/models/Reminder";
import { getUserIdFromRequest } from "@/lib/auth";

// GET all reminders for the authenticated user
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminders = await Reminder.find({ userId }).sort({
      pinned: -1,
      order: 1,
      createdAt: -1,
    });

    return NextResponse.json(
      {
        reminders: reminders.map((reminder) => ({
          id: (reminder._id as any).toString(),
          title: reminder.title,
          category: reminder.category,
          upgradeType: reminder.upgradeType,
          totalSeconds: reminder.totalSeconds,
          remainingSeconds: reminder.remainingSeconds,
          isActive: reminder.isActive,
          isCompleted: reminder.isCompleted,
          createdAt: reminder.createdAt,
          endTime: reminder.endTime,
          pausedAt: reminder.pausedAt,
          pinned: reminder.pinned || false,
          order: reminder.order || 0,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create a new reminder
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, category, upgradeType, hours, minutes, seconds } =
      await req.json();

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const now = Date.now();

    // Get the maximum order for new reminders to place at end
    const maxOrderReminder = await Reminder.findOne({ userId })
      .sort({ order: -1 })
      .limit(1);
    const newOrder = maxOrderReminder?.order ? maxOrderReminder.order + 1 : 0;

    const reminder = await Reminder.create({
      userId,
      title: title?.trim() || undefined,
      category,
      upgradeType,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isActive: true,
      isCompleted: false,
      createdAt: now,
      endTime: now + totalSeconds * 1000,
      order: newOrder,
    });

    return NextResponse.json(
      {
        reminder: {
          id: (reminder._id as any).toString(),
          title: reminder.title,
          category: reminder.category,
          upgradeType: reminder.upgradeType,
          totalSeconds: reminder.totalSeconds,
          remainingSeconds: reminder.remainingSeconds,
          isActive: reminder.isActive,
          isCompleted: reminder.isCompleted,
          createdAt: reminder.createdAt,
          endTime: reminder.endTime,
          pausedAt: reminder.pausedAt,
          pinned: reminder.pinned || false,
          order: reminder.order || 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
