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

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState<"login" | "2fa" | "register" | "verify-account">("login")
  const [otpCode, setOtpCode] = React.useState("")
  const [verifyCode, setVerifyCode] = React.useState("")
  
  // States for password visibility
  const [showPassword, setShowPassword] = React.useState(false)
  const [showRegPassword, setShowRegPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: ""
  })

  const passwordsMatch = formData.password === formData.confirmPassword || formData.confirmPassword === ""

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulação de verificação de credenciais
    setTimeout(() => {
      // Verifica se o 2FA está ativado especificamente para este navegador/sessão
      const is2FAEnabled = localStorage.getItem("passguard_2fa_enabled") === "true"
      
      if (is2FAEnabled) {
        setStep("2fa")
        setLoading(false)
      } else {
        toast({
          title: "Cofre Aberto",
          description: "Acesso autorizado com sucesso.",
        })
        router.push("/dashboard")
      }
    }, 800)
  }

  const handleRegister = (e: React.FormEvent) => {
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
    // Simulação de criação de conta
    // Limpamos o 2FA antigo para garantir que o novo usuário não tenha isso ativado por engano
    localStorage.removeItem("passguard_2fa_enabled")
    
    setTimeout(() => {
      toast({
        title: "Código Enviado!",
        description: `Enviamos um código de confirmação para ${formData.email}`,
      })
      setStep("verify-account")
      setLoading(false)
    }, 1200)
  }

  const handleConfirmVerification = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulação de validação do código de e-mail/sms
    setTimeout(() => {
      if (verifyCode.length === 6) {
        toast({
          title: "Conta Verificada!",
          description: "Seu e-mail foi confirmado com sucesso. Agora você pode acessar o cofre.",
        })
        setStep("login")
        setLoading(false)
        setVerifyCode("")
      } else {
        setLoading(false)
        toast({
          variant: "destructive",
          title: "Código Inválido",
          description: "O código de verificação está incorreto.",
        })
      }
    }, 800)
  }

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulação de validação do código OTP (Google Authenticator)
    setTimeout(() => {
      if (otpCode.length === 6) {
        toast({
          title: "Identidade Confirmada",
          description: "Segunda camada de proteção validada.",
        })
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl mb-4 rotate-3">
            <Shield className="w-10 h-10" />
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
              {step === "verify-account" && `Digite o código de 6 dígitos enviado para ${formData.email || 'seu e-mail'}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "login" && (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email or Phone</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="name@example.com" 
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button variant="link" type="button" className="p-0 h-auto text-xs text-primary">Forgot password?</Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pl-10 pr-10"
                        required
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="gap-2" onClick={() => router.push("/dashboard")}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => router.push("/dashboard")}>
                    <Smartphone className="w-4 h-4" />
                    Phone
                  </Button>
                </div>
              </>
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

            {step === "verify-account" && (
              <form onSubmit={handleConfirmVerification} className="space-y-6 py-2">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Mail className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="v-code" className="text-center block">Código de Confirmação</Label>
                    <Input 
                      id="v-code" 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000" 
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button className="w-full h-11" disabled={loading || verifyCode.length !== 6} type="submit">
                    {loading ? "Verificando..." : "Confirmar E-mail"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    type="button" 
                    className="w-full text-muted-foreground" 
                    onClick={() => setStep("register")}
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Alterar dados
                  </Button>
                </div>
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
