"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Save, Edit3, Trash2, Copy, X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import type { ActionButtonsProps } from "@/lib/types"

export const ActionButtons = memo(function ActionButtons({
  record,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-1 justify-center">
      {record.isEditing ? (
        <>
          <Button
            size="sm"
            onClick={onSave}
            className="h-8 px-2"
            style={{
              backgroundColor: COLORS.SUCCESS,
              color: COLORS.TEXT_LIGHT,
            }}
            title="Guardar cambios (Ctrl+Enter)"
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="h-8 px-2"
            style={{
              borderColor: COLORS.BORDER,
              color: COLORS.TEXT_DARK,
            }}
            title="Cancelar edición"
          >
            <X className="w-3 h-3" />
          </Button>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="h-8 px-2"
            style={{
              borderColor: COLORS.INFO,
              color: COLORS.INFO,
            }}
            title="Editar agenda"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicate}
            className="h-8 px-2"
            style={{
              borderColor: COLORS.SECONDARY,
              color: COLORS.SECONDARY,
            }}
            title="Duplicar agenda"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="h-8 px-2"
            style={{
              borderColor: COLORS.ERROR,
              color: COLORS.ERROR,
            }}
            title="Eliminar agenda"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </>
      )}
    </div>
  )
})
