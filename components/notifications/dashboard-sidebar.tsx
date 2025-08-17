"use client"

import { useState } from "react"
import { Bell, Settings, Users, BarChart3, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface DashboardSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function DashboardSidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const [activeItem, setActiveItem] = useState("notifications")

  const menuItems = [
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "users", label: "المستخدمين", icon: Users },
    { id: "analytics", label: "التحليلات", icon: BarChart3 },
    { id: "security", label: "الأمان", icon: Shield },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!collapsed && <h2 className="text-lg font-semibold text-slate-900 dark:text-white">القائمة الرئيسية</h2>}
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="hidden lg:flex">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeItem === item.id ? "default" : "ghost"}
              className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")}
              onClick={() => setActiveItem(item.id)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="right" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
