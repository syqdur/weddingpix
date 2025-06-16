"use client"

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
} from "@/components/ui"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  createSpotifyIntegration,
  deleteSpotifyIntegration,
  getSpotifyIntegration,
  updateSpotifyIntegration,
} from "@/lib/actions/spotify-integration.actions"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Shield } from "lucide-react"

const formSchema = z.object({
  playlistId: z.string().min(1, {
    message: "Playlist ID is required.",
  }),
  active: z.boolean().default(false),
})

interface SpotifyAdminModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  isAdmin: boolean
}

const SpotifyAdminModal = ({ open, setOpen, isAdmin }: SpotifyAdminModalProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistId: "",
      active: false,
    },
  })

  const { data: spotifyIntegration, isLoading } = useQuery({
    queryKey: ["spotifyIntegration"],
    queryFn: getSpotifyIntegration,
  })

  useEffect(() => {
    if (spotifyIntegration) {
      form.setValue("playlistId", spotifyIntegration.playlistId)
      form.setValue("active", spotifyIntegration.active)
    }
  }, [spotifyIntegration, form])

  const { mutate: createIntegration } = useMutation(createSpotifyIntegration, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spotifyIntegration"] })
      toast({
        title: "Spotify Integration created!",
      })
      setOpen(false)
      router.refresh()
    },
    onError: (error: any) => {
      toast({
        title: "Something went wrong!",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const { mutate: updateIntegration } = useMutation(updateSpotifyIntegration, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spotifyIntegration"] })
      toast({
        title: "Spotify Integration updated!",
      })
      setOpen(false)
      router.refresh()
    },
    onError: (error: any) => {
      toast({
        title: "Something went wrong!",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const { mutate: deleteIntegration } = useMutation(deleteSpotifyIntegration, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spotifyIntegration"] })
      toast({
        title: "Spotify Integration deleted!",
      })
      setOpen(false)
      router.refresh()
    },
    onError: (error: any) => {
      toast({
        title: "Something went wrong!",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (spotifyIntegration) {
      updateIntegration({
        playlistId: values.playlistId,
        active: values.active,
      })
    } else {
      createIntegration({
        playlistId: values.playlistId,
        active: values.active,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Spotify-Integration (Admin-Bereich)</DialogTitle>
          <DialogDescription>Verwalte hier die Spotify-Integration für die Hochzeits-Playlist.</DialogDescription>
        </DialogHeader>
        {isAdmin ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className={`grid gap-2 transition-colors duration-300 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              <FormField
                control={form.control}
                name="playlistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Playlist ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      Die ID der Spotify-Playlist, in die die Songs hinzugefügt werden sollen.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Integration aktivieren</FormLabel>
                      <FormDescription>Aktiviere oder deaktiviere die Spotify-Integration.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogActions>
              {spotifyIntegration ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteIntegration()
                  }}
                >
                  Integration löschen
                </Button>
              ) : null}
              <Button type="submit">Speichern</Button>
            </DialogActions>
          </form>
        ) : (
          <div
            className={`p-6 rounded-xl transition-colors duration-300 ${
              isDarkMode ? "bg-blue-900/20 border border-blue-700/30" : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield
                className={`w-8 h-8 transition-colors duration-300 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
              />
              <div>
                <h4
                  className={`text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? "text-blue-300" : "text-blue-800"
                  }`}
                >
                  🎵 Spotify-Integration (Admin-Bereich)
                </h4>
                <p
                  className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-blue-200" : "text-blue-700"}`}
                >
                  Diese Einstellungen sind nur für Admins verfügbar
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg transition-colors duration-300 ${
                isDarkMode ? "bg-gray-800/50" : "bg-white/50"
              }`}
            >
              <div
                className={`p-3 rounded-lg mb-3 transition-colors duration-300 ${
                  isDarkMode ? "bg-green-900/20 border border-green-700/30" : "bg-green-50 border border-green-200"
                }`}
              >
                <h5
                  className={`font-semibold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-green-300" : "text-green-800"
                  }`}
                >
                  ✅ Du kannst trotzdem Songs hinzufügen!
                </h5>
                <p
                  className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? "text-green-200" : "text-green-700"
                  }`}
                >
                  Als Gast kannst du jederzeit Songs zur Hochzeits-Playlist hinzufügen. Diese werden automatisch zur
                  Spotify-Playlist hinzugefügt, wenn ein Admin die Integration eingerichtet hat.
                </p>
              </div>

              <p className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Die Spotify-Integration ermöglicht es Admins, die technische Verbindung zu Spotify zu verwalten und eine
                Ziel-Playlist auszuwählen. Alle Gäste können aber unabhängig davon Songs hinzufügen.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SpotifyAdminModal
