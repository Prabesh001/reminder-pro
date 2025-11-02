import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reminder from '@/models/Reminder';
import { getUserIdFromRequest } from '@/lib/auth';
import { sendCompletionEmail } from '@/lib/email';
import User from '@/models/User';

// POST sync reminders - update countdowns and check for completions
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    const reminders = await Reminder.find({
      userId,
      isCompleted: false,
    });

    const updatedReminders = [];
    const completedReminders = [];

    for (const reminder of reminders) {
      if (reminder.isActive && reminder.endTime) {
        const remaining = Math.max(0, Math.floor((reminder.endTime - now) / 1000));

        if (remaining <= 0) {
          // Reminder completed
          const updated = await Reminder.findByIdAndUpdate(
            reminder._id,
            {
              remainingSeconds: 0,
              isCompleted: true,
              isActive: false,
            },
            { new: true }
          );

          if (updated) {
            completedReminders.push(updated);

            // Send email notification
            const user = await User.findById(userId);
            if (user) {
              await sendCompletionEmail(
                user.email,
                updated.title || '',
                updated.category
              );
            }
          }
        } else {
          // Update remaining time
          await Reminder.findByIdAndUpdate(reminder._id, {
            remainingSeconds: remaining,
          });
          updatedReminders.push({
            id: reminder._id.toString(),
            remainingSeconds: remaining,
          });
        }
      } else if (!reminder.isActive && reminder.pausedAt && reminder.endTime) {
        // For paused reminders, calculate remaining based on paused time
        const remaining = Math.max(0, Math.floor((reminder.endTime - reminder.pausedAt) / 1000));
        await Reminder.findByIdAndUpdate(reminder._id, {
          remainingSeconds: remaining,
        });
      }
    }

    return NextResponse.json(
      {
        updated: updatedReminders,
        completed: completedReminders.map((r) => ({
          id: r._id.toString(),
          title: r.title,
          category: r.category,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Sync reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

