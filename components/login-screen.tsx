"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Building2 } from "lucide-react"

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)

    // Simulate Azure AD authentication
    setTimeout(() => {
      setIsLoading(false)
      onLogin()
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F4F6] p-4">
      <div className="w-full max-w-md">
        {/* Hospital Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-[#7F0C43] rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#333333] mb-2">Hospital Vozandes Quito</h1>
          <p className="text-[#666666] text-sm">Sistema de Gestión de Agendas Médicas</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border-[#E5E5E5] shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center text-[#333333]">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-[#666666]">
              Ingrese con su cuenta de Microsoft Azure AD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#333333] font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#666666]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@vozandes.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-[#E5E5E5] focus:border-[#7F0C43] focus:ring-[#7F0C43]"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#7F0C43] hover:bg-[#6A0A38] text-white font-medium py-2.5"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#E5E5E5]">
              <p className="text-xs text-center text-[#666666]">
                Al iniciar sesión, acepta los términos y condiciones del sistema.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#666666]">© 2025 Hospital Vozandes Quito. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
