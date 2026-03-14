"use client"

import * as React from "react"
import { generateCustomPassword, type GenerateCustomPasswordInput } from "@/ai/flows/generate-custom-password-flow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Shield, RefreshCcw, Copy, Check, Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PasswordGeneratorProps {
  onApply?: (password: string) => void
}

export function PasswordGenerator({ onApply }: PasswordGeneratorProps) {
  const [loading, setLoading] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()

  const [options, setOptions] = React.useState<GenerateCustomPasswordInput>({
    length: 16,
    minSpecialChars: 2,
    minUppercase: 2,
    minLowercase: 2,
    minDigits: 2,
  })

  const generate = async () => {
    setLoading(true)
    try {
      const result = await generateCustomPassword(options)
      setPassword(result.password)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Could not generate password. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

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
  }, [])

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
            variant="primary"
            onClick={generate}
            disabled={loading}
            title="Regenerate password"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
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