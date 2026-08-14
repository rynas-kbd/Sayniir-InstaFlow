'use client'

import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteClient } from './actions'
import { useT } from '@/components/i18n-provider'

export default function DeleteClientButton({ userId }: { userId: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <form
        ref={formRef}
        action={async () => {
          await deleteClient(userId)
        }}
      >
        <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
          <Trash2 className="size-4" /> {t('admin.clients.detail.deleteButton.triggerButton')}
        </Button>
      </form>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.clients.detail.deleteButton.dialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.clients.detail.deleteButton.dialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.clients.detail.deleteButton.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formRef.current?.requestSubmit()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('admin.clients.detail.deleteButton.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
