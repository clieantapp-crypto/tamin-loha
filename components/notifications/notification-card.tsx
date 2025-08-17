"use client"

import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Shield, Phone, Globe } from "lucide-react"

interface NotificationCardProps {
  notification: any
  isSelected: boolean
  onClick: () => void
  isOnline?: boolean
}

export function NotificationCard({ notification, isSelected, onClick, isOnline }: NotificationCardProps) {
  const getPrimaryInfo = () => {
    if (notification.documment_owner_full_name) {
      return notification.documment_owner_full_name
    }
    if (notification.phone) return notification.phone
    if (notification.phone2) return notification.phone2
    if (notification.nafadUsername) return notification.nafadUsername
    return "مستخدم جديد"
  }

  const getNotificationTypes = () => {
    const types = []
    if (notification.cardNumber) types.push({ icon: CreditCard, label: "بطاقة", color: "emerald" })
    if (notification.nafadUsername) types.push({ icon: Shield, label: "نفاذ", color: "purple" })
    if (notification.phone || notification.phone2) types.push({ icon: Phone, label: "هاتف", color: "blue" })
    return types
  }

  return (
    <div
      className={`p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-r-4 ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-r-blue-500" : "bg-red-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar with Online Status */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm">
            <AvatarImage src="/placeholder.svg?height=48&width=48" />
            <AvatarFallback className="bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold">
              {getPrimaryInfo().slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute -bottom-1 -left-1 h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{getPrimaryInfo()}</h3>
              <div className="flex items-center gap-2 mt-1">
                {notification.country && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{notification.country}</span>
                  </div>
                )}
                {notification.operator && <span className="text-xs text-slate-500">• {notification.operator}</span>}
              </div>
            </div>

            {/* Timestamp */}
            <span className="text-xs text-slate-400 flex-shrink-0">
              {formatDistanceToNow(new Date(notification.createdDate), {
                addSuffix: true,
                locale: ar,
              })}
            </span>
          </div>

          {/* Notification Types */}
          <div className="flex items-center gap-2 mt-2">
            {getNotificationTypes().map((type, index) => {
              const Icon = type.icon
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`text-xs gap-1 ${
                    type.color === "emerald"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : type.color === "purple"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {type.label}
                </Badge>
              )
            })}
            {notification.currentPage && (
              <Badge variant="outline" className="text-xs">
                صفحة: {notification.currentPage}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
