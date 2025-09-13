"use client"

import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const CELL = 24 // Cell width/height - increased for date numbers
const GAP = 8 // Gap between cells
const DOT = 5 // Dot diameter

interface WorkoutData {
  date: string
  duration: number // in minutes
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getMonthName(monthIndex: number) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  return months[monthIndex]
}

function calculateCurrentStreak(workouts: WorkoutData[], currentDate: Date): number {
  const sortedWorkouts = workouts.map((w) => new Date(w.date)).sort((a, b) => b.getTime() - a.getTime())

  let streak = 0
  const checkDate = new Date(currentDate)

  for (const workoutDate of sortedWorkouts) {
    if (workoutDate.toDateString() === checkDate.toDateString()) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (workoutDate < checkDate) {
      break
    }
  }

  return streak
}

export default function ProgressCalendar() {
  const now = React.useMemo(() => new Date(), [])
  const year = now.getFullYear()

  const [workouts, setWorkouts] = React.useState<WorkoutData[]>([])
  const [editingDate, setEditingDate] = React.useState<string | null>(null)
  const [duration, setDuration] = React.useState("")
  const [mounted, setMounted] = React.useState(false)

  // PC hover for future dots preview
  const [hoverDate, setHoverDate] = React.useState<string | null>(null)

  // Mobile popover state
  const [openDate, setOpenDate] = React.useState<string | null>(null)

  // Mobile/PC detection
  const [isCoarse, setIsCoarse] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
    const mq = window.matchMedia("(pointer: coarse)")
    const update = () => setIsCoarse(mq.matches || hasTouch)
    update()
    if (mq.addEventListener) mq.addEventListener("change", update)
    else mq.addListener(update)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update)
      else mq.removeListener(update)
    }
  }, [])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const saved = localStorage.getItem(`gym-workouts-${year}`)
    if (saved) {
      setWorkouts(JSON.parse(saved))
    }
  }, [year])

  React.useEffect(() => {
    localStorage.setItem(`gym-workouts-${year}`, JSON.stringify(workouts))
  }, [workouts, year])

  const hasWorkout = (dateString: string) => {
    return workouts.some((w) => w.date === dateString)
  }

  const getWorkout = (dateString: string) => {
    return workouts.find((w) => w.date === dateString)
  }

  const saveWorkout = (dateString: string, durationMinutes: number) => {
    setWorkouts((prev) => {
      const existing = prev.findIndex((w) => w.date === dateString)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { date: dateString, duration: durationMinutes }
        return updated
      } else {
        return [...prev, { date: dateString, duration: durationMinutes }]
      }
    })
  }

  const removeWorkout = (dateString: string) => {
    setWorkouts((prev) => prev.filter((w) => w.date !== dateString))
  }

  const currentStreak = calculateCurrentStreak(workouts, now)

  React.useEffect(() => {
    if (!isCoarse && openDate !== null) setOpenDate(null)
  }, [isCoarse, openDate])

  const raf = (cb: () => void) => {
    if (typeof window === "undefined") return cb()
    requestAnimationFrame(cb)
  }

  const months = React.useMemo(() => {
    const monthsData = []
    // September (8), October (9), November (10), December (11)
    for (let monthIndex = 8; monthIndex <= 11; monthIndex++) {
      const daysInMonth = getDaysInMonth(year, monthIndex)
      const days = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day)
        const dateString = date.toISOString().split("T")[0]
        days.push({
          day,
          dateString,
          date,
        })
      }

      monthsData.push({
        name: getMonthName(monthIndex),
        monthIndex,
        days,
      })
    }
    return monthsData
  }, [year])

  const { theme, setTheme } = useTheme()

  const daysLeftInYear = React.useMemo(() => {
    const endOfYear = new Date(year, 11, 31) // December 31st
    const diffTime = endOfYear.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }, [now, year])

  if (!mounted) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Gym Workout Tracker</h1>
          <div className="text-lg text-muted-foreground">
            Total Workouts: <span className="font-bold text-green-500">{workouts.length}</span>
          </div>
        </div>

        <div className="space-y-8">
          {months.map((month) => (
            <div key={month.monthIndex} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground text-center">
                {month.name} {year}
              </h2>

              <div
                className="grid justify-center"
                style={{
                  gridTemplateColumns: `repeat(auto-fit, ${CELL}px)`,
                  gap: `${GAP}px`,
                  maxWidth: `${Math.min(10, month.days.length) * (CELL + GAP)}px`,
                  margin: "0 auto",
                }}
                onMouseLeave={() => setHoverDate(null)}
              >
                {month.days.map(({ day, dateString, date }) => {
                  const workout = getWorkout(dateString)
                  const hasWorkoutDay = hasWorkout(dateString)
                  const isToday = date.toDateString() === now.toDateString()
                  const isPast = date < now

                  const core = (
                    <div
                      className="relative flex items-center justify-center cursor-pointer select-none rounded-lg border border-border transition-all duration-150 hover:scale-105 hover:bg-accent"
                      role="button"
                      tabIndex={0}
                      style={{ width: CELL, height: CELL }}
                      onMouseEnter={() => {
                        if (!isCoarse) {
                          raf(() => setHoverDate(dateString))
                        }
                      }}
                      onClick={(e) => {
                        if (!isCoarse) {
                          setEditingDate(dateString)
                          setDuration(workout?.duration.toString() || "")
                          return
                        }
                        e.stopPropagation()
                        raf(() => setHoverDate(dateString))
                      }}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium",
                          hasWorkoutDay
                            ? "text-foreground font-bold"
                            : isToday
                              ? "text-blue-500 font-bold"
                              : isPast
                                ? "text-muted-foreground"
                                : "text-muted-foreground/50",
                        )}
                      >
                        {day}
                      </span>

                      {hasWorkoutDay && (
                        <div
                          className="absolute bottom-0 right-0 bg-green-500 rounded-full"
                          style={{ width: DOT, height: DOT }}
                        />
                      )}

                      {isToday && <div className="absolute inset-0 border-2 border-blue-500 rounded-lg" />}
                    </div>
                  )

                  if (isCoarse) {
                    const open = openDate === dateString
                    return (
                      <Popover
                        key={dateString}
                        open={open}
                        onOpenChange={(o) => {
                          if (!o) {
                            raf(() => {
                              setOpenDate(null)
                              setHoverDate(null)
                            })
                          } else {
                            raf(() => {
                              setOpenDate(dateString)
                              setHoverDate(dateString)
                            })
                          }
                        }}
                      >
                        <PopoverTrigger asChild>{core}</PopoverTrigger>
                        <PopoverContent
                          side="top"
                          sideOffset={8}
                          align="center"
                          updatePositionStrategy="always"
                          className="w-auto min-w-0 whitespace-nowrap px-3 py-2 text-xs bg-background border border-border rounded shadow-lg"
                        >
                          <div className="space-y-2">
                            <div className="font-medium">
                              {month.name} {day}, {year}
                            </div>
                            {workout && <div className="text-green-500">Workout: {workout.duration} minutes</div>}
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingDate(dateString)
                                setDuration(workout?.duration.toString() || "")
                                setOpenDate(null)
                              }}
                              className="w-full"
                            >
                              {workout ? "Edit" : "Add"} Workout
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )
                  }

                  return (
                    <Tooltip key={dateString}>
                      <TooltipTrigger asChild>{core}</TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={8}
                        updatePositionStrategy="always"
                        className="w-auto min-w-0 whitespace-nowrap text-xs bg-background border border-border rounded shadow-lg"
                      >
                        <div>
                          <div>
                            {month.name} {day}, {year}
                          </div>
                          {workout && <div className="text-green-500 mt-1">Workout: {workout.duration} minutes</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {editingDate !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-border p-6 rounded-lg w-80 shadow-lg">
              <h3 className="text-lg font-medium text-foreground mb-4">
                {getWorkout(editingDate) ? "Edit" : "Add"} Workout
              </h3>
              <div className="text-sm text-muted-foreground mb-4">
                {new Date(editingDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="duration" className="text-foreground">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="60"
                    className="mt-1"
                    min="1"
                    max="300"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const durationNum = Number.parseInt(duration)
                      if (durationNum > 0) {
                        saveWorkout(editingDate, durationNum)
                      }
                      setEditingDate(null)
                      setDuration("")
                    }}
                    disabled={!duration || Number.parseInt(duration) <= 0}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  {getWorkout(editingDate) && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        removeWorkout(editingDate)
                        setEditingDate(null)
                        setDuration("")
                      }}
                    >
                      Remove
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingDate(null)
                      setDuration("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-border text-center">
          <div className="text-lg font-medium text-foreground">{year}</div>
          <div className="text-sm text-muted-foreground mt-1">{daysLeftInYear} days left</div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
