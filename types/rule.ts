export interface CustomRule {
  id: string
  name: string
  description: string
  pattern: string
  isRegex: boolean
  errorMessage: string
  suggestion: string
  severity: "warning" | "error" | "info"
  enabled: boolean
  createdAt: number
  category: string // 新增分类字段
}

export type RuleCategory = "references" | "numbers" | "other" | "custom"
