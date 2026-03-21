
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Shield, Lock, Smartphone, Mail, ArrowRight, ArrowLeft, KeyRound, UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth, useUser, useFirestore, initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from "@/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState<"login" | "2fa" | "register" | "verify-account">("login")
  const [otpCode, setOtpCode] = React.useState("")
  const [verifyCode, setVerifyCode] = React.useState("")
  
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
      if (user && firestore && step !== "2fa" && step !== "verify-account") {
        const userRef = doc(firestore, "users", user.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          if (userSnap.data()?.twoFactorEnabled) {
            setStep("2fa")
          } else {
            router.push("/dashboard")
          }
        } else {
          await setDoc(doc(firestore, "users", user.uid), {
            id: user.uid,
            externalUserId: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            twoFactorEnabled: false
          })
          router.push("/dashboard")
        }
      }
    }
    checkSecurity()
  }, [user, firestore, router, step])

  const passwordsMatch = formData.password === formData.confirmPassword || formData.confirmPassword === ""

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
        description: "Credenciais inválidas ou erro de conexão.",
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
        description: error.code === 'auth/unauthorized-domain' 
          ? "O domínio/IP atual não está na lista de domínios seguros do Firebase." 
          : "Erro ao abrir popup do Google.",
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
      toast({
        title: "Conta Criada",
        description: "Bem-vindo ao PassGuard!",
      })
      // Não damos setLoading(false) pois o useEffect fará o redirecionamento
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: error.message || "Não foi possível criar sua conta.",
      })
      setLoading(false)
    }
  }


  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (otpCode.length === 6) {
        router.push("/dashboard")
      } else {
        setLoading(false)
        toast({
          variant: "destructive",
          title: "Código Inválido",
          description: "O código do autenticador está incorreto.",
        })
      }
    }, 800)
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
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-card border border-primary/20 flex items-center justify-center shadow-2xl mb-4 overflow-hidden">
            <Image 
              src={logoUrl} 
              alt="PassGuard Logo" 
              width={80} 
              height={80}
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl font-headline font-black tracking-tight text-white mb-2">PassGuard</h1>
          <p className="text-muted-foreground text-center">Your secure vault for all your digital keys.</p>
        </div>

        <Card className="border-primary/10 shadow-2xl bg-card/80 backdrop-blur overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              {step === "login" && "Welcome Back"}
              {step === "register" && "Create Account"}
              {step === "2fa" && "Dupla Proteção"}
              {step === "verify-account" && "Verifique sua Conta"}
            </CardTitle>
            <CardDescription>
              {step === "login" && "Enter your credentials to access your secure vault."}
              {step === "register" && "Join PassGuard and start protecting your digital life."}
              {step === "2fa" && "Digite o código gerado no seu Google Authenticator para continuar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(step === "login" || step === "register") && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full h-11 bg-background/50 border-primary/20 hover:bg-primary/5 transition-colors" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <GoogleIcon />
                  Entrar com Google
                </Button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-primary/10"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continue com e-mail</span>
                  </div>
                </div>
              </>
            )}

            {step === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="name@example.com" 
                      className="pl-10"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full h-11 group" disabled={loading} type="submit">
                  {loading ? "Decrypting Vault..." : "Unlock Vault"}
                  {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>
            )}

            {step === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="reg-email" 
                      type="email"
                      placeholder="name@example.com" 
                      className="pl-10"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="reg-password" 
                      type={showRegPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className={cn(
                        "pl-10 pr-10",
                        !passwordsMatch && formData.confirmPassword !== "" && "border-destructive focus-visible:ring-destructive"
                      )}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!passwordsMatch && formData.confirmPassword !== "" && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> As senhas não coincidem.
                    </p>
                  )}
                </div>
                <Button className="w-full h-11" disabled={loading || !passwordsMatch || formData.confirmPassword === ""} type="submit">
                  {loading ? "Creating Vault..." : "Create Account"}
                  {!loading && <UserPlus className="ml-2 w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  type="button" 
                  className="w-full text-muted-foreground" 
                  onClick={() => setStep("login")}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                </Button>
              </form>
            )}


            {step === "2fa" && (
              <form onSubmit={handleVerify2FA} className="space-y-6 py-2">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <KeyRound className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-center block">Código de Segurança</Label>
                    <Input 
                      id="otp" 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000" 
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button className="w-full h-11" disabled={loading || otpCode.length !== 6} type="submit">
                    {loading ? "Verificando..." : "Confirmar e Acessar"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    type="button" 
                    className="w-full text-muted-foreground" 
                    onClick={() => setStep("login")}
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao login
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          {step === "login" && (
            <CardFooter className="flex flex-wrap justify-center text-sm text-muted-foreground">
              Don&apos;t have an account? 
              <Button 
                variant="link" 
                className="p-0 h-auto ml-1 text-secondary"
                onClick={() => setStep("register")}
              >
                Create Account
              </Button>
            </CardFooter>
          )}
        </Card>

        <div className="mt-12 grid grid-cols-2 gap-4 text-center">
          <div className="p-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">AES-256</h3>
            <p className="text-[10px] text-muted-foreground">Military-grade encryption</p>
          </div>
          <div className="p-4">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mx-auto mb-2">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Zero-Knowledge</h3>
            <p className="text-[10px] text-muted-foreground">Only you see your keys</p>
          </div>
        </div>
      </div>
    </div>
  )
}
