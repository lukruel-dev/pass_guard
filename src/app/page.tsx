
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { KeyRound, Mail, Lock, ShieldCheck, ShieldAlert, Shield, Smartphone, ArrowRight, ArrowLeft, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth, useUser, useFirestore, initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn, resendVerificationEmail, initiateSignOut, useMemoFirebase, useDoc } from "@/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import * as OTPAuth from "otpauth"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState<"login" | "2fa" | "register" | "verify-email">("login")
  const [otpCode, setOtpCode] = React.useState("")
  
  const [showPassword, setShowPassword] = React.useState(false)
  const [showRegPassword, setShowRegPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: ""
  })

  const logoUrl = "https://i.postimg.cc/cJQrd2f6/Gemini-Generated-Image-fczyflfczyflfczy.png";

  React.useEffect(() => {
    async function checkSecurity() {
      if (user && firestore) {
        // 1. Verificar se o e-mail está verificado (exceto para login via Google que já vem verificado)
        if (!user.emailVerified && user.providerData[0]?.providerId === 'password') {
          setStep("verify-email")
          return
        }

        // 2. Verificar 2FA se o e-mail estiver OK
        if (step !== "2fa") {
          const userRef = doc(firestore, "users", user.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            if (userSnap.data()?.twoFactorEnabled) {
              setStep("2fa")
            } else {
              router.push("/dashboard")
            }
          } else {
            // Criar perfil inicial se não existir
            await setDoc(doc(firestore, "users", user.uid), {
              id: user.uid,
              email: user.email,
              createdAt: new Date().toISOString(),
              twoFactorEnabled: false
            })
            router.push("/dashboard")
          }
        }
      }
    }
    checkSecurity()
  }, [user, firestore, router, step])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) return
    setLoading(true)

    try {
      await initiateEmailSignIn(auth, formData.email, formData.password)
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
    if (!auth) return
    setLoading(true)
    try {
      await initiateGoogleSignIn(auth)
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
    if (!auth) return
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
      await initiateEmailSignUp(auth, formData.email, formData.password)
      setStep("verify-email")
      toast({
        title: "Conta Criada",
        description: "Verifique seu e-mail para ativar sua conta.",
      })
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
    if (!auth) return
    try {
      await resendVerificationEmail(auth)
      toast({
        title: "E-mail enviado",
        description: "Um novo link de verificação foi enviado para sua caixa de entrada.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Aguarde um momento antes de reenviar.",
      })
    }
  }

  // 2FA Logic
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return doc(firestore, "users", user.uid)
  }, [firestore, user])
  
  const { data: userProfile } = useDoc<{ twoFactorEnabled: boolean, twoFactorSecret?: string }>(userDocRef)

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userProfile?.twoFactorSecret) {
      toast({
        variant: "destructive",
        title: "Erro de Configuração",
        description: "Segredo 2FA não encontrado. Entre em contato com o suporte.",
      })
      return
    }

    try {
      if (!userProfile?.twoFactorSecret) {
        throw new Error("Secret missing")
      }
      
      const totp = new OTPAuth.TOTP({
        secret: userProfile.twoFactorSecret
      })
      
      const delta = totp.validate({
        token: otpCode,
        window: 1 // Permite um delta de 30s para compensar relógios levemente dessincronizados
      })
      
      if (delta !== null) {
        toast({
          title: "Acesso Autorizado",
          description: "Bem-vindo de volta ao seu cofre.",
        })
        window.location.href = "/dashboard"
      } else {
        toast({
          variant: "destructive",
          title: "Código Inválido",
          description: "O código informado está incorreto ou expirou.",
        })
      }
    } catch (err) {
      console.error("OTP Error:", err)
      toast({
        variant: "destructive",
        title: "Erro na Verificação",
        description: "Não foi possível validar o código 2FA.",
      })
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <KeyRound className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground animate-pulse">Sincronizando Cofre...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-card border border-primary/20 flex items-center justify-center shadow-2xl mb-4 overflow-hidden">
            <Image src={logoUrl} alt="Logo" width={80} height={80} className="object-cover" />
          </div>
          <h1 className="text-4xl font-headline font-black tracking-tight text-white mb-2">PassGuard</h1>
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
              {step === "verify-email" && `Enviamos um link para ${user?.email || 'seu e-mail'}`}
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
                      if (auth) {
                        await initiateSignOut(auth);
                        setStep("login");
                      }
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
                  <form onSubmit={handleVerify2FA} className="space-y-6">
                    <Input 
                      type="text" maxLength={6} placeholder="000000" 
                      className="text-center text-2xl tracking-widest h-14"
                      value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      required autoFocus
                    />
                    <Button className="w-full h-11" disabled={otpCode.length !== 6} type="submit">Acessar</Button>
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
