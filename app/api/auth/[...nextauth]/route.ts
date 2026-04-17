import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null
        
        // ICI : En prod, comparer le hash. Pour le test, on compare en clair (NON SECURISE)
        const isPasswordValid = user.password === credentials.password 
        
        if (!isPasswordValid) return null

        return { id: user.id, email: user.email, name: user.name }
      }
    })
  ],
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }: any) {
      if (session.user) session.user.id = token.id as string
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }