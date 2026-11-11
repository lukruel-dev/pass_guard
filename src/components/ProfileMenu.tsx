"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useUser, useAuthContext } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sun, Moon, LogOut, Laptop } from "lucide-react"
import { useRouter } from "next/navigation"

export function ProfileMenu() {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useAuthContext()
  const { setTheme, theme } = useTheme()

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário"
  const avatarUrl = user.user_metadata?.avatar_url || ""
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "U"

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      if (user?.id) {
        localStorage.removeItem(`passguard_2fa_verified_${user.id}`)
      }
      sessionStorage.removeItem("passguard_2fa_verified")
      localStorage.removeItem("passguard_auth_step")
    }
    await signOut()
    router.replace("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-border/50 hover:border-primary/50 transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={user.email || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 py-1.5">
          Aparência
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2 cursor-pointer">
          <Sun className="h-4 w-4" />
          <span>Claro</span>
          {theme === "light" && <span className="ml-auto w-2 h-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2 cursor-pointer">
          <Moon className="h-4 w-4" />
          <span>Escuro</span>
          {theme === "dark" && <span className="ml-auto w-2 h-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2 cursor-pointer">
          <Laptop className="h-4 w-4" />
          <span>Sistema</span>
          {theme === "system" && <span className="ml-auto w-2 h-2 rounded-full bg-primary" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
