"use client"

import * as React from "react"
import { PasswordCard } from "@/components/PasswordCard"
import { PasswordForm } from "@/components/PasswordForm"
import { TwoFactorSetup } from "@/components/TwoFactorSetup"
import { ProfileMenu } from "@/components/ProfileMenu"
import { type PasswordEntry } from "@/app/lib/types"
import { Shield, Search, KeyRound, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useUser, useSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const supabase = useSupabase()
  
  const [entries, setEntries] = React.useState<PasswordEntry[]>([])
  const [isEntriesLoading, setIsEntriesLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [show2FASetup, setShow2FASetup] = React.useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(false)

  // Reabre modal de 2FA automaticamente se havia configuração pendente ao alternar apps
  React.useEffect(() => {
    if (user && typeof window !== "undefined") {
      const pendingSecret = localStorage.getItem(`passguard_pending_2fa_secret_${user.id}`)
      if (pendingSecret) {
        setShow2FASetup(true)
      }
    }
  }, [user])

  // Redireciona se não estiver logado ou se 2FA não estiver verificado
  React.useEffect(() => {
    async function checkAuthAnd2FA() {
      if (!isUserLoading && !user) {
        router.push("/")
        return
      }

      if (user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("two_factor_enabled")
            .eq("id", user.id)
            .maybeSingle()

          if (profile?.two_factor_enabled) {
            setIs2FAEnabled(true)
            const isVerified = typeof window !== "undefined" && (
              localStorage.getItem(`passguard_2fa_verified_${user.id}`) === "true" ||
              sessionStorage.getItem("passguard_2fa_verified") === "true"
            )
            if (!isVerified) {
              router.push("/")
              return
            }
          }
        } catch (err) {
          console.error("Erro no guard 2FA:", err)
        }
      }
    }

    checkAuthAnd2FA()
  }, [user, isUserLoading, router, supabase])

  // Carrega as senhas do Supabase
  const loadEntries = React.useCallback(async () => {
    if (!user) return
    try {
      setIsEntriesLoading(true)
      const { data, error } = await supabase
        .from("password_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err: any) {
      console.error("Erro ao carregar senhas:", err)
      toast({
        variant: "destructive",
        title: "Erro ao carregar senhas",
        description: err.message || "Não foi possível sincronizar o cofre.",
      })
    } finally {
      setIsEntriesLoading(false)
    }
  }, [user, supabase, toast])

  // Carrega status 2FA
  const loadProfile = React.useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("two_factor_enabled")
        .eq("id", user.id)
        .maybeSingle()

      if (data) {
        setIs2FAEnabled(!!data.two_factor_enabled)
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err)
    }
  }, [user, supabase])

  React.useEffect(() => {
    if (user) {
      loadEntries()
      loadProfile()
    }
  }, [user, loadEntries, loadProfile])

  const addEntry = async (entry: Omit<PasswordEntry, "id" | "createdAt" | "created_at">) => {
    if (!user) return

    try {
      const passwordValue = (entry as any).password || entry.encrypted_password || entry.encryptedPassword || ""
      const newEntry = {
        user_id: user.id,
        name: entry.name,
        username: entry.username,
        encrypted_password: passwordValue,
        url: entry.url || "",
        notes: entry.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from("password_entries")
        .insert(newEntry)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setEntries(prev => [data, ...prev])
      }
      toast({
        title: "Senha Salva",
        description: `${entry.name} foi guardado com sucesso.`,
      })
    } catch (err: any) {
      console.error("Erro ao salvar senha:", err)
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Falha ao gravar no Supabase.",
      })
    }
  }

  const deleteEntry = async (id: string) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from("password_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      setEntries(prev => prev.filter(e => e.id !== id))
      toast({
        title: "Removido",
        description: "Entrada excluída do cofre.",
      })
    } catch (err: any) {
      console.error("Erro ao deletar senha:", err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Não foi possível deletar o registro.",
      })
    }
  }

  const filteredEntries = entries.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.username.toLowerCase().includes(search.toLowerCase())
  )

  if (isUserLoading || (isEntriesLoading && entries.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <KeyRound className="w-12 h-12 text-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight">PassGuard</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 text-muted-foreground hover:text-primary relative px-2 sm:px-3"
              onClick={() => setShow2FASetup(true)}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden xs:inline">Segurança</span>
              {is2FAEnabled && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-background shadow-sm" />
              )}
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold">Meu Cofre</h1>
            <p className="text-muted-foreground mt-1">Gerencie e proteja suas credenciais na nuvem Supabase.</p>
          </div>
          <PasswordForm onAdd={addEntry} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card p-4 rounded-xl border flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entradas salvas</p>
              <p className="font-bold text-xl">{entries.length}</p>
            </div>
          </div>
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar senhas ou serviços..."
              className="pl-10 h-full bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map(entry => (
              <PasswordCard 
                key={entry.id} 
                entry={entry} 
                onDelete={deleteEntry} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-muted">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma senha encontrada</h3>
            <p className="text-muted-foreground mt-1">
              {search ? "Tente outro termo de busca" : "Adicione sua primeira senha para começar"}
            </p>
            {!search && (
               <div className="mt-6">
                 <PasswordForm onAdd={addEntry} />
               </div>
            )}
          </div>
        )}
      </main>

      <TwoFactorSetup 
        open={show2FASetup} 
        onOpenChange={(open) => {
          setShow2FASetup(open)
          if (!open) loadProfile()
        }} 
      />
    </div>
  )
}
