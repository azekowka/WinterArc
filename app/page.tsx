import ProgressCalendar from "@/components/progress-calendar"
import { Space_Mono } from "next/font/google"

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})

export default function Page() {
  return (
    <main className={`${spaceMono.className} min-h-screen bg-black text-white flex items-center justify-center p-6`}>
      <ProgressCalendar />
    </main>
  )
}
