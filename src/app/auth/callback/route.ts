import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error && data?.user) {
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        const baseUrl = isLocalEnv
          ? origin
          : forwardedHost
            ? `https://${forwardedHost}`
            : origin

        // Verifica no Supabase se o usuário possui 2FA ativo
        const { data: profile } = await supabase
          .from("profiles")
          .select("two_factor_enabled")
          .eq("id", data.user.id)
          .maybeSingle()

        if (profile?.two_factor_enabled) {
          // Se tiver 2FA ativo, vai direto para a tela de autenticação de dois fatores
          return NextResponse.redirect(`${baseUrl}/?step=2fa`)
        }

        // Se NÃO tiver 2FA ativo, vai direto para o dashboard sem passar pela tela de login!
        return NextResponse.redirect(`${baseUrl}/dashboard`)
      } else {
        console.error("Erro no exchangeCodeForSession:", error)
      }
    } catch (err) {
      console.error("Exceção no callback de autenticação:", err)
    }
  }

  // Redireciona de volta para a raiz em caso de erro
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}

