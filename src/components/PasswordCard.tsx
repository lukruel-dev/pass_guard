"use client"

import * as React from "react"
import { type PasswordEntry } from "@/app/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Eye, EyeOff, Trash2, Globe, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PasswordCardProps {
  entry: PasswordEntry
  onDelete: (id: string) => void
}

export function PasswordCard({ entry, onDelete }: PasswordCardProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(entry.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied",
      description: `${entry.name} password copied to clipboard.`
    })
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/40 group bg-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg leading-none">{entry.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{entry.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={entry.password}
              readOnly
              className="w-full bg-background border-none rounded p-2 pr-20 text-sm font-mono focus:ring-1 focus:ring-primary/30 outline-none"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}