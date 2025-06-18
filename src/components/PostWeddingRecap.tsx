"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Camera, Mail, Share2, BarChart3, ArrowLeft, Plus, X, Sparkles } from "lucide-react"

// Erstmal ohne Firebase-Import für Debugging
// import { db } from "../config/firebase"
// import {
//   collection,
//   addDoc,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   doc,
//   query,
//   orderBy,
//   serverTimestamp,
// } from "firebase/firestore"

interface MediaItem {
  id: string
  name: string
  type: "image" | "video" | "note"
  url?: string
  content?: string
  timestamp: string
  uploadedBy: string
}

interface PostWeddingRecapProps {
  isDarkMode: boolean
  mediaItems: MediaItem[]
  isAdmin: boolean
  userName: string
}

interface Moment {
  id: string
  title: string
  description: string
  mediaItems: MediaItem[]
  category: "ceremony" | "reception" | "party" | "special" | "custom"
  timestamp: string
  location?: string
  tags: string[]
}

interface ThankYouCard {
  id: string
  recipientName: string
  recipientEmail: string
  message: string
  template: string
  selectedMoments: string[]
  status: "draft" | "ready"
  createdAt: string
  shareableLink: string
}

// Debug-Version ohne Firebase
export const PostWeddingRecap: React.FC<PostWeddingRecapProps> = ({ isDarkMode, mediaItems, isAdmin, userName }) => {
  console.log("PostWeddingRecap wird geladen...", { isDarkMode, mediaItems, isAdmin, userName })

  const [activeSection, setActiveSection] = useState<"moments" | "cards" | "share" | "analytics">("moments")
  const [moments, setMoments] = useState<Moment[]>([])
  const [thankYouCards, setThankYouCards] = useState<ThankYouCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Test-Daten für Debugging
  useEffect(() => {
    console.log("useEffect wird ausgeführt...")

    try {
      // Simuliere Laden
      setTimeout(() => {
        console.log("Lade Test-Daten...")

        const testMoments: Moment[] = [
          {
            id: "test-1",
            title: "Test Moment",
            description: "Dies ist ein Test-Moment",
            mediaItems: [],
            category: "special",
            timestamp: new Date().toISOString(),
            location: "Test Location",
            tags: ["test"],
          },
        ]

        const testCards: ThankYouCard[] = [
          {
            id: "card-test-1",
            recipientName: "Test Familie",
            recipientEmail: "test@example.com",
            message: "Test Nachricht",
            template: "elegant",
            selectedMoments: ["test-1"],
            status: "ready",
            createdAt: new Date().toISOString(),
            shareableLink: "https://example.com/test",
          },
        ]

        setMoments(testMoments)
        setThankYouCards(testCards)
        setIsLoading(false)

        console.log("Test-Daten geladen:", { testMoments, testCards })
      }, 1000)
    } catch (err) {
      console.error("Fehler beim Laden:", err)
      setError(`Fehler: ${err}`)
      setIsLoading(false)
    }
  }, [])

  // Error Boundary
  if (error) {
    console.error("Error State:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <X className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">Debug: Fehler gefunden!</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    console.log("Loading State aktiv...")
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className={`text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Debug: Lade Post-Hochzeits-Zusammenfassung...
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Wenn das länger als 5 Sekunden dauert, gibt es ein Problem.
          </p>
        </div>
      </div>
    )
  }

  console.log("Komponente wird gerendert:", { moments, thankYouCards })

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Debug Info */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Debug Mode:</strong> Komponente läuft! Momente: {moments.length}, Karten: {thankYouCards.length}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div
        className={`border-b transition-colors duration-300 ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => console.log("Zurück-Button geklickt")}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-full transition-colors duration-300 ${
                    isDarkMode ? "bg-pink-600" : "bg-pink-500"
                  }`}
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-3xl font-bold transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    💕 Post-Hochzeits-Zusammenfassung (Debug)
                  </h1>
                  <p
                    className={`text-lg transition-colors duration-300 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Kristin & Maurizio • 12. Juli 2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`border-b transition-colors duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: "moments", label: "Momente sammeln", icon: <Camera className="w-4 h-4" /> },
              { id: "cards", label: "Dankeskarten", icon: <Mail className="w-4 h-4" /> },
              { id: "share", label: "Teilen & Verteilen", icon: <Share2 className="w-4 h-4" /> },
              { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log("Tab gewechselt:", tab.id)
                  setActiveSection(tab.id as any)
                }}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium transition-all duration-300 ${
                  activeSection === tab.id
                    ? isDarkMode
                      ? "border-pink-400 text-pink-400"
                      : "border-pink-600 text-pink-600"
                    : isDarkMode
                      ? "border-transparent text-gray-400 hover:text-gray-200"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === "moments" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  📸 Momente sammeln (Debug)
                </h2>
                <p className={`transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Debug: {moments.length} Momente geladen
                </p>
              </div>
              <button
                onClick={() => {
                  console.log("Moment hinzufügen geklickt")
                  alert("Debug: Moment hinzufügen funktioniert!")
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
              >
                <Plus className="w-4 h-4" />
                Moment hinzufügen (Debug)
              </button>
            </div>

            {/* Moments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moments.map((moment) => (
                <div
                  key={moment.id}
                  className={`rounded-2xl border p-6 transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-lg"
                  }`}
                >
                  <h3
                    className={`font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {moment.title}
                  </h3>
                  <p
                    className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {moment.description}
                  </p>
                  <div className="mt-4 text-xs text-green-600">Debug: ID {moment.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "cards" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  💌 Dankeskarten (Debug)
                </h2>
                <p className={`transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Debug: {thankYouCards.length} Karten geladen
                </p>
              </div>
              <button
                onClick={() => {
                  console.log("Dankeskarte erstellen geklickt")
                  alert("Debug: Dankeskarte erstellen funktioniert!")
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
              >
                <Plus className="w-4 h-4" />
                Dankeskarte erstellen (Debug)
              </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {thankYouCards.map((card) => (
                <div
                  key={card.id}
                  className={`rounded-2xl border p-6 transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-lg"
                  }`}
                >
                  <h3
                    className={`font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {card.recipientName}
                  </h3>
                  <p
                    className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {card.message}
                  </p>
                  <div className="mt-4 text-xs text-green-600">Debug: ID {card.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "share" && (
          <div
            className={`p-8 rounded-2xl border text-center ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              🌐 Teilen & Verteilen (Debug)
            </h2>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Debug: Share-Sektion funktioniert!</p>
          </div>
        )}

        {activeSection === "analytics" && (
          <div
            className={`p-8 rounded-2xl border text-center ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              📊 Analytics (Debug)
            </h2>
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Debug: Analytics-Sektion funktioniert!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
