import { Clock } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Clock className="w-16 h-16 text-slate-600 mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">No Reminders Yet</h3>
      <p className="text-slate-400 max-w-sm">
        Create your first reminder to get started. Set a duration and watch the countdown!
      </p>
    </div>
  )
}
