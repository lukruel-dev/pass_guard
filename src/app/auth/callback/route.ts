import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        const baseUrl = isLocalEnv
          ? origin
          : forwardedHost
            ? `https://${forwardedHost}`
            : origin

        return NextResponse.redirect(`${baseUrl}${next}`)
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

