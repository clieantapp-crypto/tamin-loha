"use client"

import { useState, useEffect } from "react"
import { onValue, ref } from "firebase/database"
import { database } from "@/lib/firestore"

export function useOnlineUsers() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const onlineUsersRef = ref(database, "status")
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const statuses: Record<string, boolean> = {}
        let count = 0

        Object.entries(data).forEach(([userId, status]: [string, any]) => {
          const isOnline = status.state === "online"
          statuses[userId] = isOnline
          if (isOnline) count++
        })

        setOnlineStatuses(statuses)
        setOnlineUsersCount(count)
      }
    })
    return () => unsubscribe()
  }, [])

  return { onlineUsersCount, onlineStatuses }
}
