"use client"

import { memo } from "react"
import { COLORS } from "@/lib/constants"

export const Header = memo(function Header() {
  return (
    <header 
      className="bg-white border-b px-6 py-4 flex-shrink-0"
      style={{ borderColor: COLORS.BORDER }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="http://horizon-html:35480/public/img_directorio/logo.svg" 
            alt="Hospital Vozandes Quito" 
            className="h-12 w-auto"
          />
          <div>
            <h1 
              className="text-xl font-bold"
              style={{ color: COLORS.TEXT_DARK }}
            >
              Staff de Médicos
            </h1>
          </div>
        </div>
      </div>
    </header>
  )
})
