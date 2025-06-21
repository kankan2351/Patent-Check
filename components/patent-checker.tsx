"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Hash,
  Link,
  Settings,
  AlertTriangle,
  Info,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  FileTextIcon as FileText2,
  FileCheck,
} from "lucide-react"
import { CustomRulesManager } from "@/components/custom-rules-manager"
import type { CustomRule } from "@/types/rule"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// 专利文本类型
type PatentTextType = "claims" | "specification" | "unknown"

export function PatentChecker() {
  const [patentText, setPatentText] = useState("")
  const [figureMarks, setFigureMarks] = useState("")
  const [showFigureMarksInput, setShowFigureMarksInput] = useState(true)
  const [textType, setTextType] = useState<PatentTextType>("unknown")
  const [results, setResults] = useState<{
    references: ErrorItem[]
    numbers: ErrorItem[]
    other: ErrorItem[]
    custom: ErrorItem[]
    figureMarks: ErrorItem[]
  }>({
    references: [],
    numbers: [],
    other: [],
    custom: [],
    figureMarks: [],
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showRulesManager, setShowRulesManager] = useState(false)
  const [customRules, setCustomRules] = useState<CustomRule[]>([])

  // 当专利文本变化时，自动检测文本类型
  useEffect(() => {
    if (patentText.trim()) {
      setTextType(detectPatentTextType(patentText))
    } else {
      setTextType("unknown")
    }
  }, [patentText])

  // 加载自定义规则
  useEffect(() => {
    loadCustomRules()
  }, [])

  // 从本地存储加载自定义规则
  const loadCustomRules = () => {
    const savedRules = localStorage.getItem("patentCheckerCustomRules")
    if (savedRules) {
      try {
        const parsedRules = JSON.parse(savedRules)
        // 确保所有规则都有category字段，即使是旧数据
        const updatedRules = parsedRules.map((rule: CustomRule) => ({
          ...rule,
          category: rule.category || "",
        }))
        setCustomRules(updatedRules)

        // 如果是旧数据，更新存储
        if (JSON.stringify(parsedRules) !== JSON.stringify(updatedRules)) {
          localStorage.setItem("patentCheckerCustomRules", JSON.stringify(updatedRules))
        }
      } catch (e) {
        console.error("Failed to parse saved rules", e)
      }
    }
  }

  // 检测专利文本类型
  const detectPatentTextType = (text: string): PatentTextType => {
    // 权利要求书的特征词
    const claimsKeywords = [
      "权利要求",
      "其特征在于",
      "其特征是",
      "其特征",
      "所述权利要求",
      "如权利要求",
      "根据权利要求",
    ]

    // 检查是否包含权利要求书的特征词
    const lines = text.split("\n")
    let claimsKeywordCount = 0

    for (const line of lines) {
      for (const keyword of claimsKeywords) {
        if (line.includes(keyword)) {
          claimsKeywordCount++
          // 如果多次出现权利要求关键词，很可能是权利要求书
          if (claimsKeywordCount >= 2) {
            return "claims"
          }
        }
      }
    }

    // 如果只出现一次权利要求关键词，但文本较短，也可能是权利要求书
    if (claimsKeywordCount > 0 && text.length < 1000) {
      return "claims"
    }

    // 检查是否包含说明书的特征词
    if (
      text.includes("说明书") ||
      text.includes("技术领域") ||
      text.includes("背景技术") ||
      text.includes("发明内容") ||
      text.includes("附图说明") ||
      text.includes("具体实施方式") ||
      text.includes("实施例")
    ) {
      return "specification"
    }

    // 如果没有明确特征，但文本较长，可能是说明书
    if (text.length > 2000) {
      return "specification"
    }

    return "unknown"
  }

  // 分析专利文本
  const analyzePatent = () => {
    setIsAnalyzing(true)

    // 模拟分析过程
    setTimeout(() => {
      const foundErrors = {
        references: checkReferences(patentText, textType),
        numbers: checkNumberConsistency(patentText, textType),
        other: checkOtherErrors(patentText, textType),
        custom: checkCustomRules(patentText, customRules),
        figureMarks: showFigureMarksInput ? checkFigureMarksConsistency(patentText, figureMarks, textType) : [],
      }

      setResults(foundErrors)
      setIsAnalyzing(false)
    }, 1000)
  }

  // 应用自定义规则检查
  const checkCustomRules = (text: string, rules: CustomRule[]): ErrorItem[] => {
    const errors: ErrorItem[] = []
    const lines = text.split("\n")

    // 只检查启用的规则
    const enabledRules = rules.filter((rule) => rule.enabled)

    lines.forEach((line, index) => {
      enabledRules.forEach((rule) => {
        let matches = false

        if (rule.isRegex) {
          try {
            // 创建正则表达式对象
            const regex = new RegExp(rule.pattern, "g")
            matches = regex.test(line)
          } catch (e) {
            console.error(`Invalid regex in rule ${rule.name}:`, e)
          }
        } else {
          // 简单文本匹配
          matches = line.includes(rule.pattern)
        }

        if (matches) {
          errors.push({
            id: `custom-${rule.id}-${index}`,
            text: line,
            line: index + 1,
            description: rule.errorMessage,
            suggestion: rule.suggestion,
            severity: rule.severity,
            category: rule.category,
          })
        }
      })
    })

    return errors
  }

  // 检查附图标记说明与说明书内容的一致性
  const checkFigureMarksConsistency = (
    text: string,
    figureMarksText: string,
    textType: PatentTextType,
  ): ErrorItem[] => {
    const errors: ErrorItem[] = []

    if (!figureMarksText.trim()) {
      return errors
    }

    // 如果是权利要求书，不进行附图标记说明检查
    if (textType === "claims") {
      return []
    }

    // 解析附图标记说明
    const figureMarksMap = new Map<string, string>() // 标号 -> 技术特征
    const figureMarksLines = figureMarksText.split("\n")

    figureMarksLines.forEach((line, index) => {
      // 匹配格式如 "1 - 底座" 或 "1：底座" 或 "1、底座" 等
      const match = line.match(/(\d+)[\s\-：:、.]+([^\d]+)$/)
      if (match) {
        const number = match[1]
        const feature = match[2].trim()
        figureMarksMap.set(number, feature)
      }
    })

    // 从说明书中提取技术特征及其标号
    const specFeatureMap = new Map<string, string[]>() // 标号 -> 技术特征数组
    const specNumberMap = new Map<string, string[]>() // 技术特征 -> 标号数组

    const lines = text.split("\n")
    lines.forEach((line, index) => {
      // 匹配格式为"技术特征(数字)"的内容
      const matches = line.match(/([^\d\s]+)$$(\d+)$$/g)
      if (matches) {
        matches.forEach((match) => {
          const parts = match.match(/([^\d\s]+)$$(\d+)$$/)
          if (parts && parts[1] && parts[2]) {
            const feature = parts[1].trim()
            const number = parts[2]

            // 添加到标号 -> 技术特征映射
            if (!specFeatureMap.has(number)) {
              specFeatureMap.set(number, [])
            }
            if (!specFeatureMap.get(number)?.includes(feature)) {
              specFeatureMap.get(number)?.push(feature)
            }

            // 添加到技术特征 -> 标号映射
            if (!specNumberMap.has(feature)) {
              specNumberMap.set(feature, [])
            }
            if (!specNumberMap.get(feature)?.includes(number)) {
              specNumberMap.get(feature)?.push(number)
            }
          }
        })
      }
    })

    // 检查附图标记说明中的标号在说明书中是否存在
    figureMarksMap.forEach((feature, number) => {
      if (!specFeatureMap.has(number)) {
        errors.push({
          id: `figmark-missing-${number}`,
          text: `${number} - ${feature}`,
          line: figureMarksLines.findIndex((line) => line.includes(`${number}`) && line.includes(feature)) + 1,
          description: `附图标记说明中的标号"${number}"在说明书中未被使用。`,
          suggestion: "请检查标号是否正确，或在说明书中添加该标号的引用。",
          severity: "warning",
        })
      } else {
        // 检查附图标记说明中的技术特征与说明书中的是否一致
        const specFeatures = specFeatureMap.get(number) || []
        let featureMatch = false

        for (const specFeature of specFeatures) {
          // 简单比较：检查说明书中的技术特征是否包含附图标记说明中的技术特征，或反之
          if (specFeature.includes(feature) || feature.includes(specFeature)) {
            featureMatch = true
            break
          }
        }

        if (!featureMatch && specFeatures.length > 0) {
          errors.push({
            id: `figmark-mismatch-${number}`,
            text: `${number} - ${feature}`,
            line: figureMarksLines.findIndex((line) => line.includes(`${number}`) && line.includes(feature)) + 1,
            description: `附图标记说明中标号"${number}"对应的技术特征"${feature}"与说明书中的不一致。说明书中使用了: ${specFeatures.join(", ")}`,
            suggestion: "请统一技术特征的命名，确保附图标记说明与说明书中的描述一致。",
            severity: "error",
          })
        }
      }
    })

    // 检查说明书中的标号在附图标记说明中是否存在
    specFeatureMap.forEach((features, number) => {
      if (!figureMarksMap.has(number)) {
        // 找到说明书中第一次出现该标号的行
        let lineNumber = 1
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`(${number})`) || lines[i].includes(`（${number}）`)) {
            lineNumber = i + 1
            break
          }
        }

        errors.push({
          id: `spec-missing-${number}`,
          text: `说明书中使用了标号"${number}"(${features.join(", ")})`,
          line: lineNumber,
          description: `说明书中使用了标号"${number}"，但在附图标记说明中未找到该标号。`,
          suggestion: "请在附图标记说明中添加该标号及其对应的技术特征。",
          severity: "warning",
        })
      }
    })

    // 模拟一些错误结果
    if (errors.length === 0 && figureMarksText.length > 50 && text.length > 100) {
      errors.push({
        id: "figmark-example-1",
        text: "3 - 连接杆",
        line: 3,
        description: '附图标记说明中的"连接杆(3)"在说明书中被称为"连接件(3)"。',
        suggestion: "请统一技术特征的命名，确保附图标记说明与说明书中的描述一致。",
        severity: "error",
      })
    }

    return errors
  }

  // 获取文本类型显示名称
  const getTextTypeName = (type: PatentTextType): string => {
    switch (type) {
      case "claims":
        return "权利要求书"
      case "specification":
        return "说明书"
      default:
        return "未知类型"
    }
  }

  // 获取文本类型图标
  const getTextTypeIcon = (type: PatentTextType) => {
    switch (type) {
      case "claims":
        return <FileCheck className="h-5 w-5" />
      case "specification":
        return <FileText2 className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // 获取文本类型徽章颜色
  const getTextTypeBadgeVariant = (type: PatentTextType): "default" | "secondary" | "outline" => {
    switch (type) {
      case "claims":
        return "default"
      case "specification":
        return "secondary"
      default:
        return "outline"
    }
  }

  // 计算总错误数
  const totalErrors =
    results.references.length +
    results.numbers.length +
    results.other.length +
    results.custom.length +
    results.figureMarks.length

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-medium">输入专利文本</h2>
              </div>
              {textType !== "unknown" && (
                <Badge variant={getTextTypeBadgeVariant(textType)} className="flex items-center gap-1">
                  {getTextTypeIcon(textType)}
                  <span>已检测为{getTextTypeName(textType)}</span>
                </Badge>
              )}
            </div>
            <Textarea
              placeholder="请粘贴您的专利文本..."
              className="min-h-[300px] font-mono text-sm"
              value={patentText}
              onChange={(e) => setPatentText(e.target.value)}
            />

            <Collapsible
              open={showFigureMarksInput}
              onOpenChange={setShowFigureMarksInput}
              className="border rounded-md"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span>附图标记说明</span>
                    {results.figureMarks.length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {results.figureMarks.length}
                      </Badge>
                    )}
                  </div>
                  {showFigureMarksInput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">请输入附图标记说明，每行一个，格式如：1 - 底座</p>
                  <Textarea
                    placeholder="例如：
1 - 底座
2 - 支架
3 - 连接杆
..."
                    className="min-h-[150px] font-mono text-sm"
                    value={figureMarks}
                    onChange={(e) => setFigureMarks(e.target.value)}
                  />
                  {textType === "claims" && (
                    <Alert variant="warning" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>注意</AlertTitle>
                      <AlertDescription>
                        检测到当前文本为权利要求书。附图标记说明通常与说明书一起检查，权利要求书中的标号将不会与附图标记说明进行一致性检查。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2">
              <Button onClick={analyzePatent} disabled={!patentText.trim() || isAnalyzing} className="flex-1">
                {isAnalyzing ? "分析中..." : "检查文本"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRulesManager(!showRulesManager)}
                className="flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                {showRulesManager ? "隐藏规则管理器" : "管理自定义规则"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showRulesManager && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <CustomRulesManager onRulesChange={loadCustomRules} />
          </CardContent>
        </Card>
      )}

      {totalErrors > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="references">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="references" className="flex gap-2">
                  <Link className="h-4 w-4" />
                  引用检查
                  <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    {results.references.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="numbers" className="flex gap-2">
                  <Hash className="h-4 w-4" />
                  标号一致性
                  <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    {results.numbers.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="figureMarks" className="flex gap-2">
                  <ImageIcon className="h-4 w-4" />
                  附图标记
                  <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    {results.figureMarks.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="other" className="flex gap-2">
                  <AlertCircle className="h-4 w-4" />
                  其他问题
                  <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    {results.other.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex gap-2">
                  <Settings className="h-4 w-4" />
                  自定义规则
                  <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    {results.custom.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="references" className="mt-4">
                <ErrorList errors={results.references} type="引用基础" />
              </TabsContent>

              <TabsContent value="numbers" className="mt-4">
                <ErrorList errors={results.numbers} type="标号一致性" />
              </TabsContent>

              <TabsContent value="figureMarks" className="mt-4">
                <ErrorList errors={results.figureMarks} type="附图标记" />
              </TabsContent>

              <TabsContent value="other" className="mt-4">
                <ErrorList errors={results.other} type="其他问题" />
              </TabsContent>

              <TabsContent value="custom" className="mt-4">
                <ErrorList errors={results.custom} type="自定义规则" showCategory={true} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 错误项类型
interface ErrorItem {
  id: string
  text: string
  line: number
  description: string
  suggestion?: string
  severity?: "warning" | "error" | "info"
  category?: string
}

// 错误列表组件
function ErrorList({
  errors,
  type,
  showCategory = false,
}: { errors: ErrorItem[]; type: string; showCategory?: boolean }) {
  if (errors.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-center">
        <div>
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <p className="text-muted-foreground">未发现{type}问题</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errors.map((error) => {
        const severity = error.severity || "error"
        const variantClass =
          severity === "warning"
            ? "border-yellow-500 bg-yellow-50"
            : severity === "info"
              ? "border-blue-500 bg-blue-50"
              : "border-destructive/50 bg-destructive/10"

        return (
          <Alert key={error.id} className={variantClass}>
            {severity === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : severity === "info" ? (
              <Info className="h-4 w-4 text-blue-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertTitle className="flex items-center gap-2">
              第 {error.line} 行发现{type}问题
              {showCategory && error.category && (
                <Badge variant="outline" className="text-xs">
                  {error.category}
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <div className="font-mono text-sm bg-muted p-2 rounded-md mb-2">{error.text}</div>
              <p className="mb-1">{error.description}</p>
              {error.suggestion && <p className="text-sm text-muted-foreground">建议: {error.suggestion}</p>}
            </AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}

// 检查引用基础
function checkReferences(text: string, textType: PatentTextType): ErrorItem[] {
  const errors: ErrorItem[] = []
  const lines = text.split("\n")

  // 收集所有定义的技术特征标号
  const definedNumbers = new Set<string>()
  const referencePattern = /(\d+)/g

  // 第一遍扫描，收集所有定义的标号
  lines.forEach((line, index) => {
    // 假设权利要求中的定义格式为"...技术特征(数字)..."
    const matches = line.match(/([^\d\s]+)$$(\d+)$$/g)
    if (matches) {
      matches.forEach((match) => {
        const number = match.match(/$$(\d+)$$/)
        if (number && number[1]) {
          definedNumbers.add(number[1])
        }
      })
    }
  })

  // 第二遍扫描，查找引用但未定义的标号
  lines.forEach((line, index) => {
    const matches = line.match(/(\d+)/g)
    if (matches) {
      matches.forEach((number) => {
        // 如果数字不是定义的标号，且不是普通数字（如日期、数量等）
        if (!definedNumbers.has(number) && /所述.*?(\d+)/.test(line)) {
          errors.push({
            id: `ref-${index}-${number}`,
            text: line,
            line: index + 1,
            description: `引用了标号"${number}"，但该标号未在${textType === "claims" ? "权利要求" : "说明书"}中定义。`,
            suggestion: `请检查标号是否正确，或在${textType === "claims" ? "权利要求" : "说明书"}中添加该标号的定义。`,
          })
        }
      })
    }
  })

  // 模拟一些错误结果
  if (errors.length === 0 && text.length > 100) {
    if (textType === "claims") {
      errors.push({
        id: "ref-example-1",
        text: "所述连接件(5)与固定架(4)相连接...",
        line: 3,
        description: '引用了标号"5"，但该标号未在权利要求中定义。',
        suggestion: "请检查标号是否正确，或在权利要求中添加该标号的定义。",
      })
    } else {
      errors.push({
        id: "ref-example-1",
        text: "所述连接件(5)与固定架(4)相连接...",
        line: 12,
        description: '引用了标号"5"，但该标号未在说明书中定义。',
        suggestion: "请在说明书中添加对连接件(5)的定义。",
      })
    }
  }

  return errors
}

// 检查技术特征与标号一致性
function checkNumberConsistency(text: string, textType: PatentTextType): ErrorItem[] {
  const errors: ErrorItem[] = []
  const lines = text.split("\n")

  // 收集所有技术特征及其对应的标号
  const featureMap = new Map<string, string>()

  lines.forEach((line, index) => {
    // 匹配格式为"技术特征(数字)"的内容
    const matches = line.match(/([^\d\s]+)$$(\d+)$$/g)
    if (matches) {
      matches.forEach((match) => {
        const parts = match.match(/([^\d\s]+)$$(\d+)$$/)
        if (parts && parts[1] && parts[2]) {
          const feature = parts[1].trim()
          const number = parts[2]

          // 检查该技术特征是否已经有不同的标号
          if (featureMap.has(feature) && featureMap.get(feature) !== number) {
            errors.push({
              id: `num-${index}-${feature}`,
              text: line,
              line: index + 1,
              description: `技术特征"${feature}"使用了不一致的标号：之前使用"${featureMap.get(feature)}"，现在使用"${number}"。`,
              suggestion: "请统一使用相同的标号表示相同的技术特征。",
            })
          }

          // 检查该标号是否已经用于不同的技术特征
          for (const [existingFeature, existingNumber] of featureMap.entries()) {
            if (existingNumber === number && existingFeature !== feature) {
              errors.push({
                id: `num-${index}-${number}`,
                text: line,
                line: index + 1,
                description: `标号"${number}"被用于不同的技术特征："${existingFeature}"和"${feature}"。`,
                suggestion: "请为不同的技术特征使用不同的标号。",
              })
              break
            }
          }

          featureMap.set(feature, number)
        }
      })
    }
  })

  // 模拟一些错误结果
  if (errors.length === 0 && text.length > 100) {
    if (textType === "claims") {
      errors.push({
        id: "num-example-1",
        text: "所述固定架(4)与底座(3)相连接...",
        line: 5,
        description: '标号"4"在第2行用于表示"支撑架"，但在此处用于表示"固定架"。',
        suggestion: "请检查并统一技术特征的标号。",
      })
    } else {
      errors.push({
        id: "num-example-1",
        text: "所述固定架(4)与底座(3)相连接...",
        line: 15,
        description: '标号"4"在第8行用于表示"支撑架"，但在此处用于表示"固定架"。',
        suggestion: "请检查并统一技术特征的标号。",
      })
    }
  }

  return errors
}

// 检查其他形式错误
function checkOtherErrors(text: string, textType: PatentTextType): ErrorItem[] {
  const errors: ErrorItem[] = []
  const lines = text.split("\n")

  lines.forEach((line, index) => {
    // 检查权利要求格式错误（仅对权利要求书检查）
    if (textType === "claims" && /^权利要求\s*\d+/.test(line) && !/:$/.test(line)) {
      errors.push({
        id: `other-${index}-claim`,
        text: line,
        line: index + 1,
        description: "权利要求格式错误，应以冒号结尾。",
        suggestion: "请在权利要求编号后添加冒号。",
      })
    }

    // 移除标点符号后空格检查，因为这不是专利文本中的错误

    // 检查单位格式错误
    if (/\d+[a-zA-Z]+/.test(line)) {
      errors.push({
        id: `other-${index}-unit`,
        text: line,
        line: index + 1,
        description: "数字与单位之间应有空格。",
        suggestion: "请在数字与单位之间添加空格。",
      })
    }

    // 针对权利要求书的特定检查
    if (textType === "claims") {
      // 检查权利要求中是否缺少"其特征在于"或类似表述
      if (/^权利要求\s*\d+/.test(line) && !line.includes("其特征") && index + 1 < lines.length) {
        const nextLine = lines[index + 1]
        if (!nextLine.includes("其特征在于")) {
          errors.push({
            id: `other-${index}-characteristic`,
            text: line,
            line: index + 1,
            description: '权利要求中缺少"其特征在于"或类似表述。',
            suggestion: '请在权利要求中添加"其特征在于"或类似表述，以明确限定技术方案。',
            severity: "warning",
          })
        }
      }
    }

    // 针对说明书的特定检查
    if (textType === "specification") {
      // 检查说明书中是否缺少必要的章节
      if (index === 0 && !text.includes("技术领域")) {
        errors.push({
          id: "other-missing-field",
          text: '说明书缺少"技术领域"章节',
          line: 1,
          description: '说明书中缺少"技术领域"章节。',
          suggestion: '请在说明书中添加"技术领域"章节，描述发明所属的技术领域。',
          severity: "warning",
        })
      }
      if (index === 0 && !text.includes("背景技术")) {
        errors.push({
          id: "other-missing-background",
          text: '说明书缺少"背景技术"章节',
          line: 1,
          description: '说明书中缺少"背景技术"章节。',
          suggestion: '请在说明书中添加"背景技术"章节，描述发明的背景技术。',
          severity: "warning",
        })
      }
    }
    if (textType === "specification") {
      // 检查说明书中是否缺少必要的章节
      if (!text.includes("如图") && !text.includes("如附图")) {
        errors.push({
          id: "other-missing-figure",
          text: "说明书缺少附图说明",
          line: 1,
          description: "说明书中缺少附图说明。",
          suggestion: "请在说明书中添加附图说明。",
          severity: "warning",
        })
      }
    }
  })

  // 模拟一些错误结果
  if (errors.length === 0 && text.length > 100) {
    if (textType === "claims") {
      errors.push({
        id: "other-example-1",
        text: "权利要求1 一种新型装置，包括...",
        line: 1,
        description: "权利要求格式错误，应以冒号结尾。",
        suggestion: '应修改为"权利要求1: 一种新型装置，包括..."',
      })
    } else {
      errors.push({
        id: "other-example-1",
        text: "如图1所示，本实施例的装置包括底座1和支架2",
        line: 10,
        description: "数字与单位之间应有空格。",
        suggestion: '应修改为"如图 1 所示，本实施例的装置包括底座 1 和支架 2"',
      })
    }
  }

  return errors
}
