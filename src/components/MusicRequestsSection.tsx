"use client"

import { useState, useEffect } from "react"
import { Plus, History } from "lucide-react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { toast } from "react-hot-toast"

import { useMusicRequests } from "@/hooks/useMusicRequests"
import { MusicRequestModal } from "./MusicRequestModal"
import { MusicRequestCard } from "./MusicRequestCard"

export const MusicRequestsSection = () => {
  const { data: session } = useSession()
  const isAdmin = session?.user?.isAdmin === true
  const router = useRouter()
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"
  const [showRequestModal, setShowRequestModal] = useState(false)
  const { allRequests, isLoading, error, mutate } = useMusicRequests()

  useEffect(() => {
    if (error) {
      toast.error("Failed to load music requests")
    }
  }, [error])

  if (isLoading) {
    return <div>Loading music requests...</div>
  }

  return (
    <section className="container py-8">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
        {/* Info Box */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <History
              className={`w-5 h-5 transition-colors duration-300 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
            />
            <h3
              className={`font-semibold transition-colors duration-300 ${
                isDarkMode ? "text-blue-300" : "text-blue-800"
              }`}
            >
              🎵 Musikwünsche für die Hochzeit
            </h3>
          </div>
          <p className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-blue-200" : "text-blue-700"}`}>
            Alle Gäste können Songs zur Hochzeits-Playlist hinzufügen ({allRequests.length} Songs)
            {isAdmin && " • Als Admin hast du zusätzlich Zugriff auf die Spotify-Integration"}
          </p>
        </div>

        {/* Add Song Button - Available for ALL users */}
        <button
          onClick={() => setShowRequestModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
            isDarkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">🎵 Song hinzufügen</span>
          <span className="sm:hidden">Hinzufügen</span>
        </button>
      </div>

      {/* Music Request List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRequests.map((request) => (
          <MusicRequestCard key={request.id} request={request} isAdmin={isAdmin} mutate={mutate} />
        ))}
      </div>

      {/* Song Request Modal */}
      <MusicRequestModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} mutate={mutate} />
    </section>
  )
}
