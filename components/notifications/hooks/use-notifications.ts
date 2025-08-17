"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firestore"

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevNotificationsRef = useRef<any[]>([])

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("/notification-alert-269289.mp3")
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Failed to play sound:", error)
      })
    }
  }, [])

  // Listen to notifications
  useEffect(() => {
    const notificationsRef = collection(db, "pays")
    const q = query(notificationsRef, orderBy("createdDate ", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Check for new notifications and play sound
      if (prevNotificationsRef.current.length > 0 && newNotifications.length > prevNotificationsRef.current.length) {
        playNotificationSound()
      }

      setNotifications(newNotifications)
      prevNotificationsRef.current = newNotifications
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [playNotificationSound])

  const updateNotification = useCallback(async (id: string, field: string, value: string) => {
    try {
      const notificationRef = doc(db, "pays", id)
      await updateDoc(notificationRef, { [field]: value })
    } catch (error) {
      console.error("Error updating notification:", error)
      throw error
    }
  }, [])

  return {
    notifications,
    isLoading,
    updateNotification,
  }
}
