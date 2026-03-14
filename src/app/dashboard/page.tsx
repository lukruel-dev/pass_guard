
"use client"

import * as React from "react"
import { PasswordCard } from "@/components/PasswordCard"
import { PasswordForm } from "@/components/PasswordForm"
import { TwoFactorSetup } from "@/components/TwoFactorSetup"
import { type PasswordEntry } from "@/app/lib/types"
import { Shield, Search, LogOut, KeyRound, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [entries, setEntries] = React.useState<PasswordEntry[]>([])
  const [search, setSearch] = React.useState("")
  const [show2FASetup, setShow2FASetup] = React.useState(false)
  const router = useRouter()

  // Initialize with some mock data for demo
  React.useEffect(() => {
    const saved = localStorage.getItem("passguard_entries")
    if (saved) {
      setEntries(JSON.parse(saved))
    } else {
      const initial = [
        { id: "1", name: "Instagram", username: "user_cool", password: "password123", createdAt: Date.now() },
        { id: "2", name: "Netflix", username: "bingewatcher@mail.com", password: "secure-pass-99", createdAt: Date.now() },
      ]
      setEntries(initial)
      localStorage.setItem("passguard_entries", JSON.stringify(initial))
    }
  }, [])

  const addEntry = (entry: Omit<PasswordEntry, "id" | "createdAt">) => {
    const newEntry: PasswordEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    const updated = [newEntry, ...entries]
    setEntries(updated)
    localStorage.setItem("passguard_entries", JSON.stringify(updated))
  }

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem("passguard_entries", JSON.stringify(updated))
  }

  const filteredEntries = entries.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
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
              className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-primary"
              onClick={() => setShow2FASetup(true)}
            >
              <Settings className="w-4 h-4" />
              Segurança
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShow2FASetup(true)} className="sm:hidden">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold">My Vault</h1>
            <p className="text-muted-foreground mt-1">Manage and protect your online credentials.</p>
          </div>
          <PasswordForm onAdd={addEntry} />
        </div>

        {/* Stats / Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card p-4 rounded-xl border flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="font-bold text-xl">{entries.length}</p>
            </div>
          </div>
          {/* Search bar integrated in the layout */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search passwords..."
              className="pl-10 h-full bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Password List */}
        {filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map(entry => (
              <PasswordCard key={entry.id} entry={entry} onDelete={deleteEntry} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-muted">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No passwords found</h3>
            <p className="text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Add your first password to get started"}
            </p>
            {!search && (
               <div className="mt-6">
                 <PasswordForm onAdd={addEntry} />
               </div>
            )}
          </div>
        )}
      </main>

      <TwoFactorSetup open={show2FASetup} onOpenChange={setShow2FASetup} />
      <Toaster />
    </div>
  )
}
