"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog } from "@headlessui/react"
import { SearchIcon } from "@heroicons/react/solid"
import { useTheme } from "next-themes"
import axios from "axios"

interface Track {
  id: string
  name: string
  artists: [{ name: string }]
  album: { images: [{ url: string }] }
  uri: string
}

interface MusicRequestModalProps {
  isOpen: boolean
  onClose: () => void
  playlistId: string
}

const MusicRequestModal: React.FC<MusicRequestModalProps> = ({ isOpen, onClose, playlistId }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  useEffect(() => {
    if (searchTerm) {
      const searchTracks = async () => {
        setLoading(true)
        try {
          const response = await axios.get("/api/search", { params: { query: searchTerm } })
          setSearchResults(response.data.tracks.items)
          setErrorMessage(null)
        } catch (error: any) {
          console.error("Search error:", error)
          setErrorMessage("Fehler bei der Suche. Bitte versuche es später noch einmal.")
          setSearchResults([])
        } finally {
          setLoading(false)
        }
      }

      searchTracks()
    } else {
      setSearchResults([])
      setErrorMessage(null)
    }
  }, [searchTerm])

  const handleTrackClick = async (track: Track) => {
    try {
      await axios.post("/api/add-to-playlist", { playlistId, trackUri: track.uri })
      setSuccessMessage(`🎉 "${track.name}" wurde zur Hochzeits-Playlist hinzugefügt!`)
      setErrorMessage(null)
      setSearchResults([])
      setSearchTerm("")
    } catch (error: any) {
      console.error("Add to playlist error:", error)
      setErrorMessage("Fehler beim Hinzufügen des Songs zur Playlist. Bitte versuche es später noch einmal.")
      setSuccessMessage(null)
    }
  }

  const handleSubmitFromUrl = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post("/api/add-from-url", { playlistId, url: urlInput })
      if (response.status === 200) {
        setSuccessMessage("🎉 Song wurde zur Hochzeits-Playlist hinzugefügt!")
        setErrorMessage(null)
      } else {
        setErrorMessage("Fehler beim Hinzufügen des Songs zur Playlist. Bitte versuche es später noch einmal.")
        setSuccessMessage(null)
      }
    } catch (error: any) {
      console.error("Add from URL error:", error)
      setErrorMessage("Fehler beim Hinzufügen des Songs zur Playlist. Bitte versuche es später noch einmal.")
      setSuccessMessage(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <Dialog.Title
                  as="h3"
                  className={`text-lg leading-6 font-medium transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Musikwunsch
                </Dialog.Title>
                <div className="mt-2">
                  <p
                    className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Alle Gäste können Songs zur Hochzeits-Playlist hinzufügen
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6">
            <div className="relative rounded-md shadow-sm mt-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon
                  className={`h-5 w-5 transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md transition-colors duration-300 ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""
                }`}
                placeholder="Song suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <p
              className={`text-xs mt-2 transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              💡 Dein Song wird sofort zur Hochzeits-Playlist hinzugefügt - kein Warten auf Genehmigung!
            </p>
          </div>

          {errorMessage && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 mx-4"
              role="alert"
            >
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4 mx-4"
              role="alert"
            >
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          {loading && (
            <div className="px-4 py-2 mt-4">
              <p
                className={`text-center transition-colors duration-300 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Suche läuft...
              </p>
            </div>
          )}

          {searchResults.length > 0 && (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 mt-4 px-4">
              {searchResults.map((track) => (
                <li key={track.id} className="py-2">
                  <button
                    onClick={() => handleTrackClick(track)}
                    className={`w-full flex items-center justify-between transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md p-2 ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{track.name}</p>
                      <p className="text-xs">{track.artists.map((artist) => artist.name).join(", ")}</p>
                    </div>
                    <img
                      src={track.album.images[0]?.url || "/placeholder.svg"}
                      alt={track.name}
                      className="h-10 w-10 rounded-md"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 sm:px-6 mt-4">
            <p
              className={`block text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Oder füge einen Song per URL hinzu:
            </p>
            <form onSubmit={handleSubmitFromUrl} className="mt-1">
              <input
                type="url"
                name="url"
                id="url"
                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors duration-300 ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""
                }`}
                placeholder="Spotify, YouTube Music, etc."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <button
                type="submit"
                className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? "Wird hinzugefügt..." : "Song hinzufügen"}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              onClick={onClose}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default MusicRequestModal
