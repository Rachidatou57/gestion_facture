import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabaseAdmin } from "@/lib/supabaseClient"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("id, email, name, password")
          .eq("email", credentials.email)
          .maybeSingle()

        if (error) {
          console.error("Auth lookup error", error)
          return null
        }

        if (!user) return null
        
        // ICI : En prod, comparer le hash. Pour le test, on compare en clair (NON SECURISE)
        const isPasswordValid = user.password === credentials.password 
        
        if (!isPasswordValid) return null

        return { id: user.id, email: user.email, name: user.name }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }