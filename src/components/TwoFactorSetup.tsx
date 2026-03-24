
"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Smartphone, Download, CheckCircle2, Copy, Check, Trash2, ShieldAlert } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, updateDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
// @ts-ignore
import { authenticator } from "otplib"

interface TwoFactorSetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()
  
  const [step, setStep] = React.useState(1)
  const [copied, setCopied] = React.useState(false)
  const [secret, setSecret] = React.useState("")

  // Check if 2FA is already enabled
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])
  
  const { data: userProfile } = useDoc<{ twoFactorEnabled: boolean, twoFactorSecret?: string }>(userDocRef)
  const isEnabled = !!userProfile?.twoFactorEnabled

  React.useEffect(() => {
    if (open && !isEnabled && !secret) {
      // Generate a new secret ONLY if not already enabled and opening for first time
      setSecret(authenticator.generateSecret())
    }
  }, [open, isEnabled, secret])

  const otpAuthUrl = React.useMemo(() => {
    if (!secret || !user) return ""
    return authenticator.keyuri(user.email || "user", "PassGuard", secret)
  }, [secret, user])

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copiado!",
      description: "Chave manual copiada para a área de transferência.",
    })
  }

  const handleEnable = () => {
    if (user && firestore && secret) {
      const userRef = doc(firestore, "users", user.uid)
      updateDocumentNonBlocking(userRef, {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        updatedAt: new Date().toISOString()
      })
      
      setStep(3)
      toast({
        title: "Proteção Ativada!",
        description: "Sua conta agora tem uma camada extra de segurança sincronizada na nuvem.",
      })
    }
  }

  const handleDisable = () => {
    if (user && firestore) {
      const userRef = doc(firestore, "users", user.uid)
      updateDocumentNonBlocking(userRef, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        updatedAt: new Date().toISOString()
      })
      
      toast({
        title: "Proteção Desativada",
        description: "A autenticação de dois fatores foi removida da sua conta.",
      })
      onOpenChange(false)
    }
  }

  const reset = () => {
    setStep(1)
    setSecret("") // Reset secret for next time
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${isEnabled ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-2xl font-headline font-bold">
            {isEnabled ? "Proteção Ativa" : "Dupla Proteção"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isEnabled 
              ? "Sua conta está protegida por 2FA." 
              : "Adicione uma camada extra de segurança usando o seu autenticador favorito."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {isEnabled ? (
            <div className="space-y-6 text-center">
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-green-500 mb-2" />
                <p className="font-semibold text-green-500">2FA Configurado</p>
                <p className="text-xs text-muted-foreground">
                  Seu vault exige um código 6-dígitos para cada novo login.
                </p>
              </div>
              
              <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                <h4 className="font-semibold text-destructive flex items-center justify-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4" /> Zona de Risco
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Ao desativar, sua conta ficará protegida apenas pela senha principal.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full" 
                  onClick={handleDisable}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Desativar 2FA
                </Button>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-primary" />
                      Passo 1: Instale o App
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Se você ainda não tem o Google Authenticator ou Authy, instale-o agora:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm" asChild className="text-[10px] sm:text-xs">
                        <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer">
                          <Download className="w-3 h-3 mr-1" /> App Store
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="text-[10px] sm:text-xs">
                        <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer">
                          <Download className="w-3 h-3 mr-1" /> Google Play
                        </a>
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setStep(2)}>Já tenho o app, continuar</Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 flex flex-col items-center">
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold">Passo 2: Escaneie o QR Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Abra o autenticador e leia este código para gerar seus tokens:
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-xl shadow-inner border">
                    <QRCodeSVG value={otpAuthUrl} size={180} />
                  </div>

                  <div className="w-full bg-muted/30 p-3 rounded text-center border border-dashed border-primary/30 relative">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Chave Manual</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-sm font-mono font-bold text-primary">{secret}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopySecret}>
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleEnable}>Confirmar Ativação</Button>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-4 space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Tudo pronto!</h3>
                    <p className="text-sm text-muted-foreground">
                      Seu vault está agora protegido com autenticação de dois fatores sincronizada na nuvem.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={reset}>Fechar</Button>
                </div>
              )}
            </>
          )}
        </div>

        {(!isEnabled || step < 3) && (
          <DialogFooter className="sm:justify-center border-t pt-4">
            <p className="text-[10px] text-muted-foreground text-center flex items-center gap-1">
              Segurança reforçada por criptografia de ponta a ponta <ShieldCheck className="w-3 h-3" />
            </p>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
