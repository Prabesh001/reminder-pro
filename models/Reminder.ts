import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReminder extends Document {
  userId: Types.ObjectId;
  title?: string;
  category: string;
  upgradeType: string;
  totalSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  isCompleted: boolean;
  createdAt: number;
  endTime: number;
  pausedAt?: number;
  pinned?: boolean;
  order?: number;
}

const ReminderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: undefined,
    },
    category: {
      type: String,
      required: true,
    },
    upgradeType: {
      type: String,
      required: true,
      default: "none",
      enum: ["building", "lab", "pet"],
    },
    totalSeconds: {
      type: Number,
      required: true,
    },
    remainingSeconds: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Number,
      required: true,
    },
    endTime: {
      type: Number,
      required: true,
    },
    pausedAt: {
      type: Number,
      default: undefined,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Reminder: Model<IReminder> =
  mongoose.models.Reminder ||
  mongoose.model<IReminder>("Reminder", ReminderSchema);

export default Reminder;
