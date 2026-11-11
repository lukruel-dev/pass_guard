"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Smartphone, Download, CheckCircle2, Copy, Check, Trash2, ShieldAlert } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useUser, useSupabase } from "@/lib/supabase"
import * as OTPAuth from "otpauth"

interface TwoFactorSetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const supabase = useSupabase()

  const [step, setStep] = React.useState(1)
  const [copied, setCopied] = React.useState(false)
  const [secret, setSecret] = React.useState("")
  const [confirmToken, setConfirmToken] = React.useState("")
  const [isEnabled, setIsEnabled] = React.useState(false)

  // Carrega status atual do perfil no Supabase
  const checkStatus = React.useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("two_factor_enabled, two_factor_secret")
        .eq("id", user.id)
        .maybeSingle()

      if (data) {
        setIsEnabled(!!data.two_factor_enabled)
      }
    } catch (err) {
      console.error("Erro ao verificar 2FA:", err)
    }
  }, [user, supabase])

  React.useEffect(() => {
    if (open) {
      checkStatus()
    }
  }, [open, checkStatus])

  // Gera novo segredo persistido
  const generateNewSecret = React.useCallback(() => {
    if (!user) return
    const newSecret = new OTPAuth.Secret().base32
    setSecret(newSecret)
    setConfirmToken("")
    setStep(2)
    if (typeof window !== "undefined") {
      localStorage.setItem(`passguard_pending_2fa_secret_${user.id}`, newSecret)
      localStorage.setItem(`passguard_setup_step_${user.id}`, "2")
    }
  }, [user])

  // Recupera segredo e passo pendentes do localStorage para não reiniciar ao alternar apps
  React.useEffect(() => {
    if (!user || isEnabled || typeof window === "undefined") return

    const pendingSecret = localStorage.getItem(`passguard_pending_2fa_secret_${user.id}`)
    const savedStep = localStorage.getItem(`passguard_setup_step_${user.id}`)

    if (pendingSecret) {
      setSecret(pendingSecret)
      if (savedStep) {
        setStep(parseInt(savedStep, 10))
      } else {
        setStep(2)
      }
    }
  }, [user, isEnabled, open])

  React.useEffect(() => {
    if (open && !isEnabled && !secret && user) {
      if (typeof window !== "undefined") {
        const pending = localStorage.getItem(`passguard_pending_2fa_secret_${user.id}`)
        if (pending) {
          setSecret(pending)
          return
        }
      }
      generateNewSecret()
    }
  }, [open, isEnabled, secret, user, generateNewSecret])

  const otpAuthUrl = React.useMemo(() => {
    if (!secret || !user) return ""
    const totp = new OTPAuth.TOTP({
      issuer: "PassGuard",
      label: user.email || "user",
      secret: secret
    })
    return totp.toString()
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

  const handleRegenerate = () => {
    if (user && typeof window !== "undefined") {
      localStorage.removeItem(`passguard_pending_2fa_secret_${user.id}`)
      localStorage.removeItem(`passguard_setup_step_${user.id}`)
    }
    generateNewSecret()
    toast({
      title: "Novo QR Code gerado",
      description: "Um novo segredo foi gerado. Atualize no seu autenticador.",
    })
  }

  const handleEnable = async () => {
    if (!user || !secret) return

    if (confirmToken.length !== 6) {
      toast({
        variant: "destructive",
        title: "Código incompleto",
        description: "Digite o código de 6 dígitos do seu autenticador para confirmar.",
      })
      return
    }

    try {
      const totp = new OTPAuth.TOTP({
        secret: secret
      })
      const delta = totp.validate({
        token: confirmToken.trim(),
        window: 2
      })

      if (delta === null) {
        toast({
          variant: "destructive",
          title: "Código Incorreto",
          description: "O código digitado não confere com o QR Code. Verifique o relógio do celular e tente novamente.",
        })
        return
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          two_factor_enabled: true,
          two_factor_secret: secret,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      if (typeof window !== "undefined") {
        localStorage.setItem(`passguard_2fa_verified_${user.id}`, "true")
        sessionStorage.setItem("passguard_2fa_verified", "true")
        localStorage.removeItem(`passguard_pending_2fa_secret_${user.id}`)
        localStorage.removeItem(`passguard_setup_step_${user.id}`)
      }

      setIsEnabled(true)
      setStep(3)
      toast({
        title: "Proteção Ativada!",
        description: "Sua conta agora tem uma camada extra de segurança no Supabase.",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao ativar 2FA",
        description: err.message || "Não foi possível salvar as configurações.",
      })
    }
  }

  const handleDisable = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) throw error

      if (typeof window !== "undefined") {
        localStorage.removeItem(`passguard_2fa_verified_${user.id}`)
        sessionStorage.removeItem("passguard_2fa_verified")
        localStorage.removeItem(`passguard_pending_2fa_secret_${user.id}`)
        localStorage.removeItem(`passguard_setup_step_${user.id}`)
      }

      setIsEnabled(false)
      toast({
        title: "Proteção Desativada",
        description: "A autenticação de dois fatores foi removida da sua conta.",
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Não foi possível desativar.",
      })
    }
  }

  const reset = () => {
    if (user && typeof window !== "undefined") {
      localStorage.removeItem(`passguard_pending_2fa_secret_${user.id}`)
      localStorage.removeItem(`passguard_setup_step_${user.id}`)
    }
    setStep(1)
    setSecret("")
    setConfirmToken("")
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

                  <div className="w-full space-y-2">
                    <Button variant="outline" asChild className="w-full border-primary/30 hover:bg-primary/5">
                      <a href={otpAuthUrl}>
                        <Smartphone className="w-4 h-4 mr-2 text-primary" /> Abrir no Google Authenticator
                      </a>
                    </Button>
                  </div>

                  <div className="w-full bg-muted/30 p-3 rounded text-center border border-dashed border-primary/30 relative">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Chave Manual (ou copie aqui)</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-sm font-mono font-bold text-primary break-all">{secret}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopySecret}>
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  <div className="w-full space-y-2 text-center pt-2 border-t border-border/50">
                    <Label className="text-xs font-semibold text-foreground">
                      Passo 3: Digite o código de 6 dígitos gerado no app para ativar:
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest h-12 bg-background font-bold"
                      value={confirmToken}
                      onChange={(e) => setConfirmToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: "smooth", block: "center" })
                        }, 250)
                      }}
                    />
                  </div>

                  <Button className="w-full" disabled={confirmToken.length !== 6} onClick={handleEnable}>
                    Confirmar e Ativar 2FA
                  </Button>

                  <div className="flex items-center justify-between w-full pt-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleRegenerate}
                    >
                      Gerar outro QR Code
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={reset}
                    >
                      Cancelar
                    </Button>
                  </div>
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
