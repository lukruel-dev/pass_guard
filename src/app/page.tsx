"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { KeyRound, Mail, Lock, ShieldCheck, ShieldAlert, Shield, Smartphone, ArrowRight, ArrowLeft, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSupabase, useUser } from "@/lib/supabase"
import * as OTPAuth from "otpauth"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useSupabase()
  const { user, isUserLoading } = useUser()
  
  const [loading, setLoading] = React.useState(false)
  const [step, setStepState] = React.useState<"login" | "2fa" | "register" | "verify-email">(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("step") === "2fa") return "2fa"
      const saved = localStorage.getItem("passguard_auth_step")
      if (saved === "2fa" || saved === "verify-email") return saved as any
    }
    return "login"
  })

  const setStep = React.useCallback((newStep: "login" | "2fa" | "register" | "verify-email") => {
    setStepState(newStep)
    if (typeof window !== "undefined") {
      if (newStep === "2fa" || newStep === "verify-email") {
        localStorage.setItem("passguard_auth_step", newStep)
      } else {
        localStorage.removeItem("passguard_auth_step")
      }
    }
  }, [])

  const [otpCode, setOtpCode] = React.useState("")
  
  const [showPassword, setShowPassword] = React.useState(false)
  const [showRegPassword, setShowRegPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [userProfile, setUserProfile] = React.useState<{ two_factor_enabled: boolean; two_factor_secret?: string } | null>(null)

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: ""
  })

  const logoUrl = "https://i.postimg.cc/cJQrd2f6/Gemini-Generated-Image-fczyflfczyflfczy.png";

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("error=auth_callback_failed")) {
      toast({
        variant: "destructive",
        title: "Falha na autenticação",
        description: "Não foi possível validar o login com Google. Tente novamente.",
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [toast])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handlePopState = () => {
      // Se estava em telas de registro ou e-mail, volta suavemente para o login inicial
      if (step === "register" || step === "verify-email") {
        setStep("login")
        window.history.pushState(null, "", window.location.pathname)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [step, setStep])

  React.useEffect(() => {
    async function checkSecurity() {
      if (!user) return

      // 1. Verificar se o e-mail precisa de confirmação
      if (!user.email_confirmed_at && user.app_metadata.provider === 'email') {
        setStep("verify-email")
        return
      }

      // 2. Verificar 2FA no Supabase
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("two_factor_enabled, two_factor_secret")
          .eq("id", user.id)
          .maybeSingle()

        if (error) {
          console.error("Erro ao consultar perfil:", error)
        }

        if (profile?.two_factor_enabled) {
          setUserProfile(profile)
          const isVerified = typeof window !== "undefined" && (
            localStorage.getItem(`passguard_2fa_verified_${user.id}`) === "true" ||
            sessionStorage.getItem("passguard_2fa_verified") === "true"
          )
          if (!isVerified) {
            setStep("2fa")
            return
          }
        } else if (!profile && !error) {
          // Cria perfil básico se não existir via trigger
          await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email,
            two_factor_enabled: false
          })
        }
        router.replace("/dashboard")
      } catch (err) {
        console.error("Erro ao verificar perfil:", err)
        router.replace("/dashboard")
      }
    }

    if (!isUserLoading && user) {
      checkSecurity()
    }
  }, [user, isUserLoading, router, supabase, setStep])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      toast({
        title: "Autenticado com sucesso",
        description: "Carregando cofre de segurança...",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no acesso",
        description: error.message || "Credenciais inválidas ou erro de conexão.",
      })
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "https://pass-guard-eight.vercel.app"
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login bloqueado",
        description: error.message || "Erro ao autenticar com Google.",
      })
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: "As senhas não coincidem.",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      if (data?.user && !data.session) {
        setStep("verify-email")
        toast({
          title: "Conta Criada",
          description: "Verifique seu e-mail para ativar sua conta.",
        })
      } else {
        toast({
          title: "Conta Criada",
          description: "Bem-vindo ao PassGuard!",
        })
        router.replace("/dashboard")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: error.message || "Não foi possível criar sua conta.",
      })
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!formData.email && !user?.email) return
    try {
      const targetEmail = formData.email || user?.email || ""
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail
      })
      if (error) throw error

      toast({
        title: "E-mail enviado",
        description: "Um novo link de verificação foi enviado para sua caixa de entrada.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Aguarde um momento antes de reenviar.",
      })
    }
  }

  const executeVerify2FA = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length !== 6 || loading) return

    setLoading(true)
    try {
      // Re-consulta o perfil atualizado do Supabase
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("two_factor_enabled, two_factor_secret")
        .eq("id", user?.id)
        .maybeSingle()

      // Se o 2FA foi desativado no banco pelo usuário/admin, libera acesso direto
      if (!freshProfile?.two_factor_enabled) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("passguard_2fa_verified", "true")
        }
        router.replace("/dashboard")
        return
      }

      const activeSecret = freshProfile.two_factor_secret || userProfile?.two_factor_secret
      if (!activeSecret) {
        toast({
          variant: "destructive",
          title: "Erro de Configuração",
          description: "Segredo 2FA não encontrado. Redefina o 2FA.",
        })
        setLoading(false)
        return
      }

      const totp = new OTPAuth.TOTP({
        secret: activeSecret
      })

      const delta = totp.validate({
        token: codeToVerify.trim(),
        window: 2 // Permite tolerância de até +/- 60 segundos para compensar relógios
      })

      if (delta !== null) {
        if (typeof window !== "undefined") {
          if (user?.id) {
            localStorage.setItem(`passguard_2fa_verified_${user.id}`, "true")
          }
          sessionStorage.setItem("passguard_2fa_verified", "true")
          localStorage.removeItem("passguard_auth_step")
        }
        toast({
          title: "Acesso Autorizado",
          description: "Bem-vindo de volta ao seu cofre.",
        })
        router.replace("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Código Inválido",
          description: "O código informado está incorreto ou expirou. Verifique o relógio do celular.",
        })
        setLoading(false)
      }
    } catch (err) {
      console.error("OTP Error:", err)
      toast({
        variant: "destructive",
        title: "Erro na Verificação",
        description: "Não foi possível validar o código 2FA.",
      })
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    executeVerify2FA(otpCode)
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
    setOtpCode(val)
    if (val.length === 6) {
      executeVerify2FA(val)
    }
  }

  const isAuthCodeInUrl = typeof window !== "undefined" && (
    window.location.search.includes("code=") || 
    window.location.hash.includes("access_token=")
  )

  // Se o usuário já está autenticado e não precisa passar por 2FA/e-mail,
  // evita piscar o formulário de login enquanto redireciona para o cofre
  if (isUserLoading || isAuthCodeInUrl || (user && step !== "2fa" && step !== "verify-email")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <KeyRound className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground animate-pulse">
            {isAuthCodeInUrl ? "Autenticando com Google..." : "Abrindo cofre de segurança..."}
          </p>
        </div>
      </div>
    )
  }

  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
    </svg>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center bg-background px-4 py-4 sm:py-8 overflow-y-auto">
      <div className="w-full max-w-md relative z-10 my-auto">
        <div className={`flex flex-col items-center transition-all duration-300 ${step === "2fa" ? "mb-3" : "mb-8"}`}>
          <div className={`rounded-3xl bg-card border-2 border-primary/30 flex items-center justify-center shadow-xl overflow-hidden group hover:border-primary/60 transition-all ${
            step === "2fa" ? "w-14 h-14 mb-2" : "w-24 h-24 mb-4"
          }`}>
            <Image 
              src={logoUrl} 
              alt="Logo" 
              width={step === "2fa" ? 56 : 96} 
              height={step === "2fa" ? 56 : 96} 
              className="object-cover" 
            />
          </div>
          <h1 className={`${step === "2fa" ? "text-2xl" : "text-4xl sm:text-5xl"} font-headline font-black tracking-tight text-foreground mb-1 drop-shadow-sm`} style={{ WebkitTextStroke: '0.5px hsl(var(--foreground)/0.1)' }}>
            PassGuard
          </h1>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>

        <Card className="border-primary/10 shadow-2xl bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              {step === "login" && "Bem-vindo"}
              {step === "register" && "Criar Conta"}
              {step === "2fa" && "Segunda Camada"}
              {step === "verify-email" && "Verifique seu E-mail"}
            </CardTitle>
            <CardDescription>
              {step === "login" && "Acesse seu cofre seguro."}
              {step === "register" && "Proteja sua vida digital hoje."}
              {step === "2fa" && "Digite o código do seu autenticador."}
              {step === "verify-email" && `Enviamos um link para ${user?.email || formData.email || 'seu e-mail'}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "verify-email" ? (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <Mail className="w-16 h-16 text-primary animate-bounce" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Você precisa verificar seu e-mail antes de acessar o cofre. 
                  Já clicou no link? Tente atualizar a página.
                </p>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Já verifiquei meu e-mail
                  </Button>
                  <Button variant="outline" onClick={handleResendEmail} className="w-full">
                    Reenviar e-mail de verificação
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setStep("login")
                    }} 
                    className="w-full"
                  >
                    Sair e usar outra conta
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {(step === "login" || step === "register") && (
                  <>
                    <Button variant="outline" className="w-full h-11" onClick={handleGoogleLogin} disabled={loading}>
                      <GoogleIcon /> Entrar com Google
                    </Button>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-primary/10"></span></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou e-mail</span></div>
                    </div>
                  </>
                )}

                {step === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <Input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <Button className="w-full h-11" disabled={loading} type="submit">
                      {loading ? "Abrindo cofre..." : "Desbloquear"}
                    </Button>
                  </form>
                )}

                {step === "register" && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <Input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmar Senha</Label>
                      <Input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                    <Button className="w-full h-11" disabled={loading} type="submit">
                      {loading ? "Criando..." : "Criar Conta"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setStep("login")}>Voltar</Button>
                  </form>
                )}

                {step === "2fa" && (
                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <Input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6} 
                      placeholder="000000" 
                      className="text-center text-3xl font-mono tracking-[0.25em] font-bold h-14 bg-background"
                      value={otpCode} 
                      onChange={handleOtpChange}
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: "smooth", block: "center" })
                        }, 250)
                      }}
                      required 
                      autoFocus
                    />
                    <Button className="w-full h-11" disabled={otpCode.length !== 6 || loading} type="submit">
                      {loading ? "Validando código..." : "Acessar"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={async () => {
                        if (typeof window !== "undefined") {
                          if (user?.id) {
                            localStorage.removeItem(`passguard_2fa_verified_${user.id}`)
                          }
                          sessionStorage.removeItem("passguard_2fa_verified")
                          localStorage.removeItem("passguard_auth_step")
                        }
                        await supabase.auth.signOut()
                        setStep("login")
                      }}
                    >
                      Sair e voltar ao login
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
          {step === "login" && (
            <CardFooter className="justify-center">
              <Button variant="link" onClick={() => setStep("register")}>Criar nova conta</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
