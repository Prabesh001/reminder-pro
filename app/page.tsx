"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddReminderForm from "@/components/add-reminder-form";
import SortableReminderList from "@/components/sortable-reminder-list";
import EmptyState from "@/components/empty-state";
import { authApi, remindersApi } from "@/lib/api";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Reminder {
  id: string;
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

type SortType =
  | "remaining-asc"
  | "remaining-desc"
  | "time-asc"
  | "time-desc"
  | "created-asc"
  | "created-desc"
  | "manual";

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>("remaining-asc");
  const router = useRouter();

  // Check authentication and load reminders on mount
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const loadedReminders = await remindersApi.getAll();
        const now = Date.now();

        // Recalculate remaining time based on endTime
        const updatedReminders = loadedReminders.map((reminder: Reminder) => {
          if (reminder.isCompleted) {
            return reminder;
          }

          if (reminder.isActive && reminder.endTime) {
            const remaining = Math.max(
              0,
              Math.floor((reminder.endTime - now) / 1000)
            );

            if (remaining <= 0) {
              return {
                ...reminder,
                remainingSeconds: 0,
                isCompleted: true,
                isActive: false,
              };
            }

            return {
              ...reminder,
              remainingSeconds: remaining,
            };
          } else if (
            !reminder.isActive &&
            reminder.pausedAt &&
            reminder.endTime
          ) {
            const remaining = Math.max(
              0,
              Math.floor((reminder.endTime - reminder.pausedAt) / 1000)
            );
            return {
              ...reminder,
              remainingSeconds: remaining,
            };
          }

          return reminder;
        });

        setReminders(updatedReminders);
        setLoading(false);
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          router.push("/login");
        } else {
          console.error("Failed to load reminders:", error);
          setLoading(false);
        }
      }
    };

    loadReminders();
  }, [router]);

  // Sync with server every 10 seconds
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const syncResult = await remindersApi.sync();

        // Update local state with sync results
        if (syncResult.completed && syncResult.completed.length > 0) {
          // Handle completed reminders
          setReminders((prev) => {
            return prev.map((r) => {
              const completed = syncResult.completed.find(
                (c: any) => c.id === r.id
              );
              if (completed) {
                // Trigger mobile notifications
                triggerMobileNotifications(r);
                return {
                  ...r,
                  isCompleted: true,
                  isActive: false,
                  remainingSeconds: 0,
                };
              }
              return r;
            });
          });
        }

        // Update remaining seconds for active reminders
        if (syncResult.updated && syncResult.updated.length > 0) {
          setReminders((prev) => {
            return prev.map((r) => {
              const updated = syncResult.updated.find(
                (u: any) => u.id === r.id
              );
              if (updated) {
                return {
                  ...r,
                  remainingSeconds: updated.remainingSeconds,
                };
              }
              return r;
            });
          });
        }
      } catch (error) {
        console.error("Sync error:", error);
      }
    }, 10000); // Sync every 10 seconds

    return () => clearInterval(syncInterval);
  }, []);

  // Countdown effect - update UI every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setReminders((prevReminders) =>
        prevReminders.map((reminder) => {
          if (reminder.isCompleted) {
            return reminder;
          }

          if (reminder.isActive && reminder.endTime) {
            const remaining = Math.max(
              0,
              Math.floor((reminder.endTime - now) / 1000)
            );

            if (remaining <= 0 && reminder.remainingSeconds > 0) {
              // Just completed - trigger notifications
              triggerMobileNotifications(reminder);
              return {
                ...reminder,
                remainingSeconds: 0,
                isCompleted: true,
                isActive: false,
              };
            }

            return {
              ...reminder,
              remainingSeconds: remaining,
            };
          } else if (
            !reminder.isActive &&
            reminder.pausedAt &&
            reminder.endTime
          ) {
            const remaining = Math.max(
              0,
              Math.floor((reminder.endTime - reminder.pausedAt) / 1000)
            );
            return {
              ...reminder,
              remainingSeconds: remaining,
            };
          }

          return reminder;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerMobileNotifications = (reminder: Reminder) => {
    // Play sound notification
    playNotification();

    // Request notification permission and send notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(
        `Reminder Completed: ${reminder.title || reminder.category}`,
        {
          body: `Your ${reminder.category} reminder has been completed!`,
          icon: "/placeholder-logo.svg",
          badge: "/placeholder-logo.svg",
          tag: reminder.id,
        }
      );
    } else if (
      "Notification" in window &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(
            `Reminder Completed: ${reminder.title || reminder.category}`,
            {
              body: `Your ${reminder.category} reminder has been completed!`,
              icon: "/placeholder-logo.svg",
              badge: "/placeholder-logo.svg",
              tag: reminder.id,
            }
          );
        }
      });
    }

    // Vibrate if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  };

  const playNotification = () => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const addReminder = async (
    title: string | undefined,
    category: string,
    upgradeType: string,
    hours: number,
    minutes: number,
    seconds: number
  ) => {
    try {
      const newReminder = await remindersApi.create(
        title,
        category,
        upgradeType,
        hours,
        minutes,
        seconds
      );
      setReminders((prevReminders) => {
        // Add new reminder and re-sort according to current sort type
        const allReminders = [...prevReminders, newReminder];
        return sortAllReminders(allReminders);
      });
    } catch (error: any) {
      console.error("Failed to add reminder:", error);
      alert("Failed to add reminder. Please try again.");
    }
  };

  const toggleReminder = async (id: string) => {
    try {
      const updated = await remindersApi.update(id, "toggle");
      setReminders((prevReminders) =>
        prevReminders.map((r) => (r.id === id ? updated : r))
      );
    } catch (error: any) {
      console.error("Failed to toggle reminder:", error);
      alert("Failed to toggle reminder. Please try again.");
    }
  };

  const postponeReminder = async (id: string) => {
    try {
      const updated = await remindersApi.update(id, "postpone");
      setReminders((prevReminders) =>
        prevReminders.map((r) => (r.id === id ? updated : r))
      );
    } catch (error: any) {
      console.error("Failed to postpone reminder:", error);
      alert("Failed to reset reminder. Please try again.");
    }
  };

  const clearReminder = async (id: string) => {
    try {
      await remindersApi.delete(id);
      setReminders((prevReminders) => prevReminders.filter((r) => r.id !== id));
    } catch (error: any) {
      console.error("Failed to delete reminder:", error);
      alert("Failed to delete reminder. Please try again.");
    }
  };

  const markCompleted = async (id: string) => {
    try {
      const updated = await remindersApi.update(id, "complete");
      setReminders((prevReminders) =>
        prevReminders.map((r) => (r.id === id ? updated : r))
      );

      // Trigger notifications
      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        triggerMobileNotifications(reminder);
      }
    } catch (error: any) {
      console.error("Failed to complete reminder:", error);
      alert("Failed to complete reminder. Please try again.");
    }
  };

  const togglePin = async (id: string) => {
    try {
      const reminder = reminders.find((r) => r.id === id);
      const action = reminder?.pinned ? "unpin" : "pin";
      const updated = await remindersApi.update(id, action);
      setReminders((prevReminders) => {
        // Update the reminder
        const newReminders = prevReminders.map((r) =>
          r.id === id ? updated : r
        );
        // Re-sort according to current sort type
        return sortAllReminders(newReminders);
      });
    } catch (error: any) {
      console.error("Failed to pin/unpin reminder:", error);
      alert("Failed to pin reminder. Please try again.");
    }
  };

  const handleReorder = async (
    newOrder: Reminder[],
    isActiveSection: boolean
  ) => {
    // Update local state immediately for smooth UX - preserve manual order
    setReminders((prev) => {
      if (isActiveSection) {
        const completed = prev.filter((r) => r.isCompleted);
        return [...newOrder, ...completed];
      } else {
        const active = prev.filter((r) => !r.isCompleted);
        return [...active, ...newOrder];
      }
    });

    // Update order on server
    try {
      await remindersApi.updateOrder(
        newOrder.map((r, index) => ({ id: r.id, order: index }))
      );
    } catch (error: any) {
      console.error("Failed to update order:", error);
      // Revert on error
      setReminders(reminders);
    }
  };

  const sortReminders = (remindersList: Reminder[]): Reminder[] => {
    const sorted = [...remindersList];

    const sortFunction = (a: Reminder, b: Reminder) => {
      switch (sortType) {
        case "remaining-asc":
          return a.remainingSeconds - b.remainingSeconds;
        case "remaining-desc":
          return b.remainingSeconds - a.remainingSeconds;
        case "time-asc":
          return a.totalSeconds - b.totalSeconds;
        case "time-desc":
          return b.totalSeconds - a.totalSeconds;
        case "created-asc":
          return a.createdAt - b.createdAt;
        case "created-desc":
          return b.createdAt - a.createdAt;
        default:
          return 0;
      }
    };

    // Sort the list
    sorted.sort(sortFunction);

    return sorted;
  };

  const sortAllReminders = (remindersList: Reminder[]): Reminder[] => {
    // Separate by completion status first
    const active = remindersList.filter((r) => !r.isCompleted);
    const completed = remindersList.filter((r) => r.isCompleted);

    // Sort each group
    const sortedActive = sortReminders(active);
    const sortedCompleted = sortReminders(completed);

    return [...sortedActive, ...sortedCompleted];
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Separate reminders into pinned and unpinned
  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);

  // If manual sort, maintain current order but separate pinned/unpinned
  // Otherwise, sort each group
  let pinnedActive: Reminder[] = [];
  let unpinnedActive: Reminder[] = [];
  let pinnedCompleted: Reminder[] = [];
  let unpinnedCompleted: Reminder[] = [];

  if (sortType === "manual") {
    // Maintain manual order using order field, just separate pinned/unpinned
    const sortedActive = [...activeReminders].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
    const sortedCompleted = [...completedReminders].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    pinnedActive = sortedActive.filter((r) => r.pinned);
    unpinnedActive = sortedActive.filter((r) => !r.pinned);
    pinnedCompleted = sortedCompleted.filter((r) => r.pinned);
    unpinnedCompleted = sortedCompleted.filter((r) => !r.pinned);
  } else {
    // Sort each group
    pinnedActive = sortReminders(activeReminders.filter((r) => r.pinned));
    unpinnedActive = sortReminders(activeReminders.filter((r) => !r.pinned));
    pinnedCompleted = sortReminders(completedReminders.filter((r) => r.pinned));
    unpinnedCompleted = sortReminders(
      completedReminders.filter((r) => !r.pinned)
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Reminder
            </h1>
            <p className="text-slate-400 text-lg">
              Manage your tasks with beautiful countdowns
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Sort Controls */}
        {reminders.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <label className="text-slate-300 text-sm">Sort by:</label>
            <select
              value={sortType}
              onChange={(e) => {
                const newSortType = e.target.value as SortType;
                setSortType(newSortType);
                // Re-sort all reminders when sort type changes
                if (newSortType !== "manual") {
                  setReminders((prev) => sortAllReminders(prev));
                }
              }}
              className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="remaining-asc">
                Remaining: Shortest to Longest
              </option>
              <option value="remaining-desc">
                Remaining: Longest to Shortest
              </option>
              <option value="created-asc">Created: Oldest First</option>
              <option value="created-desc">Created: Newest First</option>
              <option value="manual">Manual (Drag & Drop Order)</option>
            </select>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Reminder Form */}
          <div className="lg:col-span-1">
            <AddReminderForm onAdd={addReminder} />
          </div>

          {/* Reminders Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Completed Section - Top Most */}
            {completedReminders.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Completed
                </h2>
                <div className="pl-8">
                  <SortableReminderList
                    items={sortReminders(completedReminders)}
                    onToggle={toggleReminder}
                    onPostpone={postponeReminder}
                    onClear={clearReminder}
                    onComplete={markCompleted}
                    onPin={togglePin}
                    onReorder={(newOrder) => {
                      const active = reminders.filter((r) => !r.isCompleted);
                      setReminders([...active, ...newOrder]);
                      // Switch to manual sort when user drags
                      setSortType("manual");
                      remindersApi
                        .updateOrder(
                          newOrder.map((r, index) => ({
                            id: r.id,
                            order: index,
                          }))
                        )
                        .catch(console.error);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* Pinned Section - Separate section above Active */}
            {pinnedActive.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">📌</span> Pinned
                </h2>
                <div className="pl-8">
                  <SortableReminderList
                    items={pinnedActive}
                    onToggle={toggleReminder}
                    onPostpone={postponeReminder}
                    onClear={clearReminder}
                    onComplete={markCompleted}
                    onPin={togglePin}
                    onReorder={(newOrder) => {
                      setReminders((prev) => {
                        const unpinned = prev.filter(
                          (r) => !r.isCompleted && !r.pinned
                        );
                        const completed = prev.filter((r) => r.isCompleted);
                        return [...newOrder, ...unpinned, ...completed];
                      });
                      // Switch to manual sort when user drags
                      setSortType("manual");
                      remindersApi
                        .updateOrder(
                          newOrder.map((r, index) => ({
                            id: r.id,
                            order: index,
                          }))
                        )
                        .catch(console.error);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* Active Reminders (Unpinned) */}
            {unpinnedActive.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Active Reminders
                </h2>
                <div className="pl-8">
                  <SortableReminderList
                    items={unpinnedActive}
                    onToggle={toggleReminder}
                    onPostpone={postponeReminder}
                    onClear={clearReminder}
                    onComplete={markCompleted}
                    onPin={togglePin}
                    onReorder={(newOrder) => {
                      const pinned = reminders.filter(
                        (r) => !r.isCompleted && r.pinned
                      );
                      const completed = reminders.filter((r) => r.isCompleted);
                      setReminders([...pinned, ...newOrder, ...completed]);
                      // Switch to manual sort when user drags
                      setSortType("manual");
                      remindersApi
                        .updateOrder(
                          newOrder.map((r, index) => ({
                            id: r.id,
                            order: index,
                          }))
                        )
                        .catch(console.error);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {/* Empty State */}
            {reminders.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </main>
  );
}
