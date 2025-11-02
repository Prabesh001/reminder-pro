"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  { id: "cooking", label: "🍳 I'm Crazee", color: "from-orange-400 to-red-500" },
  { id: "fishing", label: "🎣 Night King", color: "from-blue-400 to-cyan-500" },
  {
    id: "bathing",
    label: "🛁 Voldemort",
    color: "from-purple-400 to-pink-500",
  },
  { id: "work", label: "💼 Stranger", color: "from-slate-400 to-slate-600" },
  {
    id: "exercise",
    label: "🏃 Heathens",
    color: "from-green-400 to-emerald-500",
  },
  { id: "study", label: "📚 Devil of Death", color: "from-yellow-400 to-amber-500" },
  { id: "break", label: "☕ Chief", color: "from-cyan-400 to-blue-500" },
];

const UPGRADE = [
  { id: "lab", label: "🔬 Lab", color: "from-orange-400 to-red-500" },
  { id: "pet", label: "🐶 Pet", color: "from-blue-400 to-cyan-500" },
  {
    id: "building",
    label: "🏢 Buildings",
    color: "from-purple-400 to-pink-500",
  },
];

interface AddReminderFormProps {
  onAdd: (
    title: string | undefined,
    upgradeType: string,
    category: string,
    hours: number,
    minutes: number,
    seconds: number
  ) => void;
}

export default function AddReminderForm({ onAdd }: AddReminderFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("cooking");
  const [upgradeType, setUpgradeType] = useState("building");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timeInput, setTimeInput] = useState("");
  const [inputMode, setInputMode] = useState<"manual" | "text">("text");

  // Parse natural language time input like "1hour 30min" or "1h 30m"
  const parseTimeInput = (
    input: string
  ): { hours: number; minutes: number; seconds: number } => {
    const normalized = input.toLowerCase().trim();
    let parsedHours = 0;
    let parsedMinutes = 0;
    let parsedSeconds = 0;

    // Patterns for hours
    const hourPatterns = [/(\d+)\s*hours?/g, /(\d+)\s*hrs?/g, /(\d+)\s*h\b/g];

    // Patterns for minutes
    const minutePatterns = [
      /(\d+)\s*minutes?/g,
      /(\d+)\s*mins?/g,
      /(\d+)\s*m\b/g,
    ];

    // Patterns for seconds
    const secondPatterns = [
      /(\d+)\s*seconds?/g,
      /(\d+)\s*secs?/g,
      /(\d+)\s*s\b/g,
    ];

    // Extract hours
    hourPatterns.forEach((pattern) => {
      const matches = [...normalized.matchAll(pattern)];
      matches.forEach((match) => {
        parsedHours += Number.parseInt(match[1] || "0", 10);
      });
    });

    // Extract minutes
    minutePatterns.forEach((pattern) => {
      const matches = [...normalized.matchAll(pattern)];
      matches.forEach((match) => {
        parsedMinutes += Number.parseInt(match[1] || "0", 10);
      });
    });

    // Extract seconds
    secondPatterns.forEach((pattern) => {
      const matches = [...normalized.matchAll(pattern)];
      matches.forEach((match) => {
        parsedSeconds += Number.parseInt(match[1] || "0", 10);
      });
    });

    // Handle simple number formats like "1:30" or "1.5"
    if (!parsedHours && !parsedMinutes && !parsedSeconds) {
      // Try "HH:MM:SS" or "HH:MM" format
      const colonMatch = normalized.match(/^(\d+):(\d+)(?::(\d+))?$/);
      if (colonMatch) {
        parsedHours = Number.parseInt(colonMatch[1] || "0", 10);
        parsedMinutes = Number.parseInt(colonMatch[2] || "0", 10);
        parsedSeconds = Number.parseInt(colonMatch[3] || "0", 10);
      } else {
        // Try decimal hours like "1.5" = 1 hour 30 minutes
        const decimalMatch = normalized.match(/^(\d+\.?\d*)$/);
        if (decimalMatch) {
          const decimal = parseFloat(decimalMatch[1]);
          parsedHours = Math.floor(decimal);
          parsedMinutes = Math.round((decimal - parsedHours) * 60);
        }
      }
    }

    return {
      hours: parsedHours,
      minutes: parsedMinutes,
      seconds: parsedSeconds,
    };
  };

  const handleTimeInputChange = (value: string) => {
    setTimeInput(value);
    const parsed = parseTimeInput(value);
    setHours(parsed.hours);
    setMinutes(parsed.minutes);
    setSeconds(parsed.seconds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Title is optional, only require time to be set
    if (hours > 0 || minutes > 0 || seconds > 0) {
      onAdd(
        title.trim() || undefined,
        category,
        upgradeType,
        hours,
        minutes,
        seconds
      );
      setTitle("");
      // setUpgradeType("building");
      setHours(0);
      setMinutes(5);
      setSeconds(0);
      setTimeInput("");
      // setCategory("work");
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 sticky top-6 max-w-[90vw] ">
      <CardHeader>
        <CardTitle className="text-white">Add Reminder</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Upgrade <span className="text-slate-500 text-xs">(optional)</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cannon"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-slate-300">
              Id
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upgrade Type */}
          <div className="space-y-2">
            <Label htmlFor="upgradeType" className="text-slate-300">
              Type
            </Label>
            <select
              id="upgradeType"
              value={upgradeType}
              onChange={(e) => setUpgradeType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {UPGRADE.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-300">Duration</Label>
              <button
                type="button"
                onClick={() =>
                  setInputMode(inputMode === "text" ? "manual" : "text")
                }
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {inputMode === "text" ? "Use manual input" : "Use text input"}
              </button>
            </div>

            {inputMode === "text" ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={timeInput}
                  onChange={(e) => handleTimeInputChange(e.target.value)}
                  placeholder='e.g., "1hour 30min" or "1h 30m" or "1:30"'
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Examples: "1hour 30min", "2h 15m", "45min", "1:30", "1.5" (1.5
                  hours)
                </p>
                {(hours > 0 || minutes > 0 || seconds > 0) && (
                  <div className="text-xs text-cyan-400 bg-slate-700/50 p-2 rounded">
                    Parsed: {hours > 0 && `${hours}h `}
                    {minutes > 0 && `${minutes}m `}
                    {seconds > 0 && `${seconds}s`}
                    {hours === 0 &&
                      minutes === 0 &&
                      seconds === 0 &&
                      "No time set"}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Hours
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) =>
                      setHours(
                        Math.max(0, Number.parseInt(e.target.value) || 0)
                      )
                    }
                    className="bg-slate-700 border-slate-600 text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Minutes
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(
                        Math.max(
                          0,
                          Math.min(59, Number.parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="bg-slate-700 border-slate-600 text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Seconds
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) =>
                      setSeconds(
                        Math.max(
                          0,
                          Math.min(59, Number.parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    className="bg-slate-700 border-slate-600 text-white text-center"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
          >
            + Add Reminder
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { CATEGORIES };
