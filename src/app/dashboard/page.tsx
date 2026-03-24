"use client"

import * as React from "react"
import { PasswordCard } from "@/components/PasswordCard"
import { PasswordForm } from "@/components/PasswordForm"
import { TwoFactorSetup } from "@/components/TwoFactorSetup"
import { ProfileMenu } from "@/components/ProfileMenu"
import { type PasswordEntry } from "@/app/lib/types"
import { Shield, Search, LogOut, KeyRound, Settings, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import { getAuth, signOut } from "firebase/auth"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [search, setSearch] = React.useState("")
  const [show2FASetup, setShow2FASetup] = React.useState(false)

  // Consulta as senhas do Firestore
  const entriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(
      collection(firestore, "users", user.uid, "password_entries"),
      orderBy("createdAt", "desc")
    )
  }, [firestore, user])

  const { data: entries, isLoading: isEntriesLoading } = useCollection<PasswordEntry>(entriesQuery)

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const addEntry = (entry: Omit<PasswordEntry, "id" | "userProfileId" | "createdAt" | "updatedAt">) => {
    if (!firestore || !user) return

    const colRef = collection(firestore, "users", user.uid, "password_entries")
    const newDocId = crypto.randomUUID()
    
    const entryData = entry as any
    addDocumentNonBlocking(colRef, {
      id: newDocId,
      userProfileId: user.uid,
      name: entry.name,
      username: entry.username,
      encryptedPassword: entryData.password || "", // No MVP, salvamos plano mas no campo correto do backend.json
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  const deleteEntry = (id: string) => {
    if (!firestore || !user) return
    const docRef = doc(firestore, "users", user.uid, "password_entries", id)
    deleteDocumentNonBlocking(docRef)
  }

  const filteredEntries = (entries || []).filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.username.toLowerCase().includes(search.toLowerCase())
  )

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])
  const { data: userProfile } = useDoc<{ twoFactorEnabled: boolean }>(userDocRef)
  const is2FAEnabled = !!userProfile?.twoFactorEnabled

  const handleLogout = async () => {
    const auth = getAuth()
    await signOut(auth)
    router.push("/")
  }

  if (isUserLoading || isEntriesLoading) {
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
            <h1 className="text-3xl font-headline font-bold">My Vault</h1>
            <p className="text-muted-foreground mt-1">Manage and protect your online credentials.</p>
          </div>
          <PasswordForm onAdd={addEntry} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card p-4 rounded-xl border flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="font-bold text-xl">{entries?.length || 0}</p>
            </div>
          </div>
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

        {filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map(entry => (
              <PasswordCard key={entry.id} entry={{...entry, password: (entry as any).encryptedPassword}} onDelete={deleteEntry} />
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
    </div>
  )
}
