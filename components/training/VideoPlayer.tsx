"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Bookmark,
  MessageSquare,
  CheckCircle,
  Eye,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface VideoPlayerProps {
  videoUrl: string
  title: string
  onComplete?: () => void
  onProgress?: (progress: number) => void
  bookmarks?: Array<{ time: number; note: string }>
  onAddBookmark?: (time: number, note: string) => void
}

export function VideoPlayer({
  videoUrl,
  title,
  onComplete,
  onProgress,
  bookmarks = [],
  onAddBookmark,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showNotes, setShowNotes] = useState(false)
  const [note, setNote] = useState("")
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)
  const [watchedPercent, setWatchedPercent] = useState(0)
  const REQUIRED_WATCH_PERCENT = 90 // Must watch 90% of video

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime)
      
      // Calculate watched percentage
      if (video.duration > 0) {
        const percent = (video.currentTime / video.duration) * 100
        setWatchedPercent(percent)
        
        // Mark as complete when 90% watched
        if (percent >= REQUIRED_WATCH_PERCENT && !hasCompletedOnce) {
          setHasCompletedOnce(true)
          onComplete?.()
        }
      }
    }
    
    const updateDuration = () => setDuration(video.duration)
    
    const handleEnded = () => {
      setIsPlaying(false)
      if (!hasCompletedOnce) {
        setHasCompletedOnce(true)
        onComplete?.()
      }
    }

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onComplete, hasCompletedOnce])

  useEffect(() => {
    if (duration > 0) {
      const progress = (currentTime / duration) * 100
      onProgress?.(progress)
    }
  }, [currentTime, duration, onProgress])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const changePlaybackSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    setPlaybackSpeed(nextSpeed)
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const addBookmark = () => {
    if (note.trim() && onAddBookmark) {
      onAddBookmark(currentTime, note.trim())
      setNote("")
      setShowNotes(false)
    }
  }

  const jumpToBookmark = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <div className="space-y-4">
      {/* Watch Progress Alert */}
      {!hasCompletedOnce && watchedPercent > 0 && (
        <Alert className={watchedPercent >= REQUIRED_WATCH_PERCENT ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              {watchedPercent >= REQUIRED_WATCH_PERCENT ? (
                <>
                  <CheckCircle className="h-4 w-4 inline mr-2 text-green-600" />
                  Video completed! You can now proceed to the quiz.
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 inline mr-2" />
                  Watch at least {REQUIRED_WATCH_PERCENT}% to complete ({Math.round(watchedPercent)}% watched)
                </>
              )}
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="overflow-hidden bg-black">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onClick={togglePlay}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Button
                size="lg"
                onClick={togglePlay}
                className="rounded-full h-20 w-20 bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-10 w-10 ml-1" />
              </Button>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 space-y-3">
            {/* Progress Bar */}
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />

            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-white hover:bg-white/20"
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={changePlaybackSpeed}
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                  <span className="ml-1 text-xs">{playbackSpeed}x</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes Section */}
      {showNotes && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note at {formatTime(currentTime)}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowNotes(false)}>
                Close
              </Button>
            </div>
            <Textarea
              placeholder="Write your notes here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button onClick={addBookmark} size="sm" className="w-full">
              <Bookmark className="h-4 w-4 mr-2" />
              Save Note
            </Button>
          </div>
        </Card>
      )}

      {/* Bookmarks List */}
      {bookmarks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center">
              <Bookmark className="h-4 w-4 mr-2" />
              Your Notes ({bookmarks.length})
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowBookmarks(!showBookmarks)}
            >
              {showBookmarks ? "Hide" : "Show"}
            </Button>
          </div>
          
          {showBookmarks && (
            <div className="space-y-2">
              {bookmarks.map((bookmark, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => jumpToBookmark(bookmark.time)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="outline" className="text-xs mb-1">
                        {formatTime(bookmark.time)}
                      </Badge>
                      <p className="text-sm text-gray-700">{bookmark.note}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => jumpToBookmark(bookmark.time)}>
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

