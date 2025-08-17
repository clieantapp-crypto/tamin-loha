"use client"
import { Search, Filter, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NotificationCard } from "./notification-card"

interface NotificationsListProps {
  notifications: any[]
  selectedId: string | null
  onSelect: (id: string) => void
  filterType: string
  onFilterChange: (type: any) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  isLoading: boolean
  onlineStatuses: Record<string, boolean>
}

export function NotificationsList({
  notifications,
  selectedId,
  onSelect,
  filterType,
  onFilterChange,
  searchTerm,
  onSearchChange,
  isLoading,
  onlineStatuses,
}: NotificationsListProps) {
  const filterOptions = [
    { value: "all", label: "جميع الإشعارات", count: notifications.length },
    { value: "card", label: "بطاقات", count: notifications.filter((n) => n.cardNumber).length },
    { value: "online", label: "متصل الآن", count: Object.values(onlineStatuses).filter(Boolean).length },
    { value: "nafaz", label: "نفاذ", count: notifications.filter((n) => n.nafadUsername).length },
    { value: "phone", label: "هواتف", count: notifications.filter((n) => n.phone || n.phone2).length },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="البحث في الإشعارات..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                {filterOptions.find((f) => f.value === filterType)?.label}
                <Badge variant="secondary" className="text-xs">
                  {filterOptions.find((f) => f.value === filterType)?.count}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className="flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {option.count}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="mr-2 text-slate-500">جاري التحميل...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8 text-slate-500">
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isSelected={selectedId === notification.id}
                onClick={() => onSelect(notification.id)}
                isOnline={onlineStatuses[notification.id]}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
