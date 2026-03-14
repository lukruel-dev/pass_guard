"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Wand2 } from "lucide-react"
import { PasswordGenerator } from "./PasswordGenerator"
import { type PasswordEntry } from "@/app/lib/types"

interface PasswordFormProps {
  onAdd: (entry: Omit<PasswordEntry, "id" | "createdAt">) => void
}

export function PasswordForm({ onAdd }: PasswordFormProps) {
  const [open, setOpen] = React.useState(false)
  const [showGenerator, setShowGenerator] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
    setFormData({ name: "", username: "", password: "" })
    setOpen(false)
    setShowGenerator(false)
  }

  const handleApplyPassword = (password: string) => {
    setFormData(prev => ({ ...prev, password }))
    setShowGenerator(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{showGenerator ? "Generate Secure Password" : "New Password Entry"}</DialogTitle>
        </DialogHeader>

        {showGenerator ? (
          <div className="space-y-4">
            <PasswordGenerator onApply={handleApplyPassword} />
            <Button variant="ghost" className="w-full" onClick={() => setShowGenerator(false)}>
              Back to Form
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Site or App Name</Label>
              <Input
                id="name"
                placeholder="e.g., Instagram, GitHub"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                placeholder="john.doe@example.com"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs text-primary gap-1"
                  onClick={() => setShowGenerator(true)}
                >
                  <Wand2 className="w-3 h-3" />
                  Generate
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">Save Entry</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}