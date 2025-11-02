"use client";

import type { Reminder } from "@/app/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORIES } from "./add-reminder-form";
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Check,
  Pin,
  PinOff,
} from "lucide-react";

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onPostpone: (id: string) => void;
  onClear: (id: string) => void;
  onComplete: (id: string) => void;
  onPin: (id: string) => void;
}

const UPGRADE = [
  { id: "lab", label: "🔬 Lab", color: "from-orange-400 to-red-500" },
  { id: "pet", label: "🐶 Pet", color: "from-blue-400 to-cyan-500" },
  {
    id: "building",
    label: "🏢 Buildings",
    color: "from-purple-400 to-pink-500",
  },
];

const getUpgradeEmoji = (type?: string) => {
  const match = UPGRADE.find(
    (item) => item.id.toLowerCase() === type?.toLowerCase()
  );
  return match ? match.label.split(" ")[0] : "🏢"; // fallback emoji
};

export default function ReminderCard({
  reminder,
  onToggle,
  onPostpone,
  onClear,
  onComplete,
  onPin,
}: ReminderCardProps) {
  const categoryInfo = CATEGORIES.find((c) => c.id === reminder.category);
  const progressPercentage =
    (reminder.remainingSeconds / reminder.totalSeconds) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Card
      className={`border-0 overflow-hidden transition-all relative max-w-[90vw] ${
        reminder.isCompleted
          ? "bg-slate-700/50 opacity-75"
          : reminder.pinned
          ? "bg-gradient-to-r from-cyan-900/40 via-slate-800 to-slate-700 shadow-xl border-2 border-cyan-400/50"
          : "bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg"
      } ${
        reminder.pinned
          ? "ring-2 ring-cyan-400 ring-opacity-70 shadow-cyan-400/20"
          : ""
      }`}
    >
      {reminder.pinned && (
        <div className="absolute top-2 right-2 z-10 bg-cyan-400/20 rounded-full p-1.5 backdrop-blur-sm">
          <Pin className="w-5 h-5 text-cyan-400" fill="currentColor" />
        </div>
      )}
      {/* Progress Bar */}
      {!reminder.isCompleted && (
        <div className="h-1 bg-slate-600">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">
                {categoryInfo?.label.split(" ")[0]}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">
                  {reminder.title
                    ? categoryInfo?.label.split(" ").slice(1).join(" ")
                    : categoryInfo?.label || ""}
                </h3>
                <p className="text-sm text-slate-400 capitalize">
                  {getUpgradeEmoji(reminder.upgradeType)}{" "}
                  {reminder.upgradeType || "Building"} (
                  <span className="text-cyan-400 font-medium">
                    {reminder.title || "Something"}
                  </span>
                  )
                </p>
              </div>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center">
            <div
              className={`text-4xl font-mono font-bold ${
                reminder.isCompleted
                  ? "text-green-400"
                  : reminder.remainingSeconds < 60
                  ? "text-red-400 animate-pulse"
                  : "text-cyan-400"
              }`}
            >
              {formatTime(reminder.remainingSeconds)}
            </div>
            {reminder.isCompleted && (
              <p className="text-xs text-green-400 mt-1">Completed!</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {!reminder.isCompleted ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPin(reminder.id)}
                className="border-slate-600 text-white hover:bg-slate-700"
                title={reminder.pinned ? "Unpin" : "Pin"}
              >
                {reminder.pinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggle(reminder.id)}
                className="flex-1 border-slate-600 text-white hover:bg-slate-700"
              >
                {reminder.isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" /> Resume
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onPostpone(reminder.id)}
                className="flex-1 border-slate-600 text-white hover:bg-slate-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>

              <Button
                size="sm"
                onClick={() => onComplete(reminder.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" /> Done
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => onClear(reminder.id)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPin(reminder.id)}
                className="border-slate-600 text-white hover:bg-slate-700"
                title={reminder.pinned ? "Unpin" : "Pin"}
              >
                {reminder.pinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => onPostpone(reminder.id)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Restart
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onClear(reminder.id)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
