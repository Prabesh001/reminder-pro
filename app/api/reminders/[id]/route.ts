import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reminder from "@/models/Reminder";
import { getUserIdFromRequest } from "@/lib/auth";
import { sendCompletionEmail } from "@/lib/email";
import User from "@/models/User";

// GET single reminder
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const reminder = await Reminder.findOne({
      _id: resolvedParams.id,
      userId,
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

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
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update reminder (toggle, postpone, complete, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { action, ...updateData } = await req.json();

    const reminder = await Reminder.findOne({
      _id: resolvedParams.id,
      userId,
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    const now = Date.now();
    let updatedReminder;

    switch (action) {
      case "toggle":
        if (reminder.isActive) {
          // Pausing
          const remaining = Math.max(
            0,
            Math.floor((reminder.endTime - now) / 1000)
          );
          updatedReminder = await Reminder.findByIdAndUpdate(
            resolvedParams.id,
            {
              isActive: false,
              pausedAt: now,
              remainingSeconds: remaining,
            },
            { new: true }
          );
        } else {
          // Resuming
          updatedReminder = await Reminder.findByIdAndUpdate(
            resolvedParams.id,
            {
              isActive: true,
              endTime: now + reminder.remainingSeconds * 1000,
              pausedAt: undefined,
            },
            { new: true }
          );
        }
        break;

      case "postpone":
        updatedReminder = await Reminder.findByIdAndUpdate(
          resolvedParams.id,
          {
            remainingSeconds: reminder.totalSeconds,
            isCompleted: false,
            isActive: true,
            endTime: now + reminder.totalSeconds * 1000,
            pausedAt: undefined,
          },
          { new: true }
        );
        break;

      case "complete":
        updatedReminder = await Reminder.findByIdAndUpdate(
          resolvedParams.id,
          {
            isCompleted: true,
            isActive: false,
            remainingSeconds: 0,
          },
          { new: true }
        );

        // Send email notification
        if (updatedReminder) {
          const user = await User.findById(userId);
          if (user) {
            await sendCompletionEmail(
              user.email,
              updatedReminder.title || "",
              updatedReminder.category
            );
          }
        }
        break;

      case "pin":
        updatedReminder = await Reminder.findByIdAndUpdate(
          resolvedParams.id,
          {
            pinned: true,
          },
          { new: true }
        );
        break;

      case "unpin":
        updatedReminder = await Reminder.findByIdAndUpdate(
          resolvedParams.id,
          {
            pinned: false,
          },
          { new: true }
        );
        break;

      case "update":
        updatedReminder = await Reminder.findByIdAndUpdate(
          resolvedParams.id,
          updateData,
          { new: true }
        );
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!updatedReminder) {
      return NextResponse.json(
        { error: "Failed to update reminder" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        reminder: {
          id: (updatedReminder._id as any).toString(),
          title: updatedReminder.title,
          category: updatedReminder.category,
          totalSeconds: updatedReminder.totalSeconds,
          remainingSeconds: updatedReminder.remainingSeconds,
          isActive: updatedReminder.isActive,
          isCompleted: updatedReminder.isCompleted,
          createdAt: updatedReminder.createdAt,
          endTime: updatedReminder.endTime,
          pausedAt: updatedReminder.pausedAt,
          pinned: updatedReminder.pinned || false,
          order: updatedReminder.order || 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE reminder
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const reminder = await Reminder.findOneAndDelete({
      _id: resolvedParams.id,
      userId,
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Reminder deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
