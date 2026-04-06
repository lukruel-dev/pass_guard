"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Shield, RefreshCcw, Copy, Check, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PasswordGeneratorProps {
  onApply?: (password: string) => void
}

interface PasswordOptions {
  length: number
  minSpecialChars: number
  minUppercase: number
  minLowercase: number
  minDigits: number
}

function generatePasswordLocally(options: PasswordOptions): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const specials = '!@#$%^&*()-_+=[]{}|;:,.<>/?'

  const chars: string[] = []

  // Add required minimums
  for (let i = 0; i < options.minLowercase; i++) {
    chars.push(lowercase[Math.floor(Math.random() * lowercase.length)])
  }
  for (let i = 0; i < options.minUppercase; i++) {
    chars.push(uppercase[Math.floor(Math.random() * uppercase.length)])
  }
  for (let i = 0; i < options.minDigits; i++) {
    chars.push(digits[Math.floor(Math.random() * digits.length)])
  }
  for (let i = 0; i < options.minSpecialChars; i++) {
    chars.push(specials[Math.floor(Math.random() * specials.length)])
  }

  // Fill remaining length with random characters from all pools
  const allChars = lowercase + uppercase + digits + specials
  const remaining = Math.max(0, options.length - chars.length)
  for (let i = 0; i < remaining; i++) {
    chars.push(allChars[Math.floor(Math.random() * allChars.length)])
  }

  // Fisher-Yates shuffle for proper randomization
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('').substring(0, options.length)
}

export function PasswordGenerator({ onApply }: PasswordGeneratorProps) {
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()

  const [options, setOptions] = React.useState<PasswordOptions>({
    length: 16,
    minSpecialChars: 2,
    minUppercase: 2,
    minLowercase: 2,
    minDigits: 2,
  })

  const generate = React.useCallback(() => {
    setPassword(generatePasswordLocally(options))
  }, [options])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied!",
      description: "Password copied to clipboard."
    })
  }

  React.useEffect(() => {
    generate()
  }, [generate])

  return (
    <div className="space-y-6 bg-card p-6 rounded-xl border shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-headline font-semibold text-lg">Generate Secure Password</h3>
      </div>

      <div className="relative group">
        <Input
          type={showPassword ? "text" : "password"}
          value={password}
          readOnly
          className="pr-24 font-mono text-lg bg-background/50 border-primary/20 focus:border-primary transition-all py-6"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={copyToClipboard}
            disabled={!password}
            title="Copy password"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="default"
            onClick={generate}
            title="Regenerate password"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Length: {options.length}</Label>
          </div>
          <Slider
            value={[options.length]}
            min={8}
            max={64}
            step={1}
            onValueChange={([val]) => setOptions(prev => ({ ...prev, length: val }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Uppercase (min)</Label>
            <Input
              type="number"
              min={0}
              value={options.minUppercase}
              onChange={(e) => setOptions(prev => ({ ...prev, minUppercase: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Lowercase (min)</Label>
            <Input
              type="number"
              min={0}
              value={options.minLowercase}
              onChange={(e) => setOptions(prev => ({ ...prev, minLowercase: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Numbers (min)</Label>
            <Input
              type="number"
              min={0}
              value={options.minDigits}
              onChange={(e) => setOptions(prev => ({ ...prev, minDigits: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Special (min)</Label>
            <Input
              type="number"
              min={0}
              value={options.minSpecialChars}
              onChange={(e) => setOptions(prev => ({ ...prev, minSpecialChars: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>
      </div>

      {onApply && (
        <Button className="w-full mt-4" onClick={() => onApply(password)}>
          Use This Password
        </Button>
      )}
    </div>
  )
}