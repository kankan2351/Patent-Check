"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PlusCircle, Edit, Trash2, AlertCircle, Info, AlertTriangle, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CustomRule } from "@/types/rule"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CategoryManager } from "@/components/category-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CustomRulesManager({ onRulesChange }: { onRulesChange: () => void }) {
  const [rules, setRules] = useState<CustomRule[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  // 从本地存储加载规则和分类
  useEffect(() => {
    const savedRules = localStorage.getItem("patentCheckerCustomRules")
    if (savedRules) {
      try {
        const parsedRules = JSON.parse(savedRules)
        setRules(parsedRules)

        // 提取所有唯一的分类
        const uniqueCategories = Array.from(
          new Set(parsedRules.map((rule: CustomRule) => rule.category).filter(Boolean)),
        )
        setCategories(uniqueCategories)
      } catch (e) {
        console.error("Failed to parse saved rules", e)
      }
    }

    const savedCategories = localStorage.getItem("patentCheckerCategories")
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories))
      } catch (e) {
        console.error("Failed to parse saved categories", e)
      }
    }
  }, [])

  // 保存规则到本地存储
  const saveRules = (updatedRules: CustomRule[]) => {
    localStorage.setItem("patentCheckerCustomRules", JSON.stringify(updatedRules))
    setRules(updatedRules)
    onRulesChange()
  }

  // 保存分类到本地存储
  const saveCategories = (updatedCategories: string[]) => {
    localStorage.setItem("patentCheckerCategories", JSON.stringify(updatedCategories))
    setCategories(updatedCategories)
  }

  // 添加或更新规则
  const addOrUpdateRule = (rule: CustomRule) => {
    let updatedRules: CustomRule[]

    if (editingRule) {
      // 更新现有规则
      updatedRules = rules.map((r) => (r.id === rule.id ? rule : r))
    } else {
      // 添加新规则
      updatedRules = [...rules, rule]
    }

    saveRules(updatedRules)
    setIsAddDialogOpen(false)
    setEditingRule(null)

    // 如果规则有新分类，更新分类列表
    if (rule.category && !categories.includes(rule.category)) {
      const updatedCategories = [...categories, rule.category]
      saveCategories(updatedCategories)
    }
  }

  // 删除规则
  const deleteRule = (id: string) => {
    const updatedRules = rules.filter((rule) => rule.id !== id)
    saveRules(updatedRules)

    // 检查是否需要更新分类列表
    const remainingCategories = Array.from(new Set(updatedRules.map((rule) => rule.category).filter(Boolean)))
    if (remainingCategories.length !== categories.length) {
      saveCategories(remainingCategories)
    }
  }

  // 切换规则启用状态
  const toggleRuleEnabled = (id: string) => {
    const updatedRules = rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
    saveRules(updatedRules)
  }

  // 编辑规则
  const editRule = (rule: CustomRule) => {
    setEditingRule(rule)
    setIsAddDialogOpen(true)
  }

  // 过滤规则
  const filteredRules = selectedCategory === "全部" ? rules : rules.filter((rule) => rule.category === selectedCategory)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">自定义检查规则</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            {showCategoryManager ? "隐藏分类管理" : "管理分类"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRule(null)} className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                添加规则
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingRule ? "编辑规则" : "添加新规则"}</DialogTitle>
              </DialogHeader>
              <RuleForm
                initialRule={editingRule}
                categories={categories}
                onSubmit={addOrUpdateRule}
                onCancel={() => {
                  setIsAddDialogOpen(false)
                  setEditingRule(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showCategoryManager && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <CategoryManager
              categories={categories}
              onCategoriesChange={saveCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </CardContent>
        </Card>
      )}

      {!showCategoryManager && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={selectedCategory === "全部" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory("全部")}
          >
            全部
          </Badge>
          {categories.map((category, index) => (
            <Badge
              key={index}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {filteredRules.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {selectedCategory === "全部" ? "您还没有创建任何自定义规则" : `在"${selectedCategory}"分类中没有规则`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedCategory === "全部"
              ? '点击"添加规则"按钮创建您的第一个自定义检查规则'
              : '点击"添加规则"按钮在此分类中创建规则'}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] rounded-md border">
          <div className="grid gap-4 p-4">
            {filteredRules.map((rule) => (
              <Card key={rule.id} className={!rule.enabled ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {rule.name}
                        <SeverityIcon severity={rule.severity} />
                        {rule.category && (
                          <Badge variant="secondary" className="text-xs">
                            {rule.category}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">{rule.description}</CardDescription>
                    </div>
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRuleEnabled(rule.id)} />
                  </div>
                </CardHeader>
                <CardContent className="pb-2 text-sm">
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rule.isRegex ? "正则表达式" : "文本匹配"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{rule.pattern}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-0">
                  <Button variant="ghost" size="icon" onClick={() => editRule(rule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

// 规则表单组件
function RuleForm({
  initialRule,
  categories,
  onSubmit,
  onCancel,
}: {
  initialRule: CustomRule | null
  categories: string[]
  onSubmit: (rule: CustomRule) => void
  onCancel: () => void
}) {
  const [rule, setRule] = useState<CustomRule>(
    initialRule || {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      pattern: "",
      isRegex: false,
      errorMessage: "",
      suggestion: "",
      severity: "error",
      enabled: true,
      createdAt: Date.now(),
      category: "",
    },
  )
  const [newCategory, setNewCategory] = useState("")
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)

  const handleChange = (field: keyof CustomRule, value: any) => {
    setRule((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 如果用户创建了新分类，使用新分类
    if (showNewCategoryInput && newCategory.trim()) {
      const finalRule = { ...rule, category: newCategory.trim() }
      onSubmit(finalRule)
    } else {
      onSubmit(rule)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">规则名称</Label>
        <Input id="name" value={rule.name} onChange={(e) => handleChange("name", e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">规则描述</Label>
        <Textarea
          id="description"
          value={rule.description}
          onChange={(e) => handleChange("description", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">规则分类</Label>
        {showNewCategoryInput ? (
          <div className="flex gap-2">
            <Input
              id="newCategory"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="输入新分类名称"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewCategoryInput(false)}
              className="whitespace-nowrap"
            >
              使用现有分类
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Select value={rule.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无分类</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewCategoryInput(true)}
              className="whitespace-nowrap"
            >
              创建新分类
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="pattern">匹配模式</Label>
          <div className="flex items-center gap-2">
            <Switch
              id="isRegex"
              checked={rule.isRegex}
              onCheckedChange={(checked) => handleChange("isRegex", checked)}
            />
            <Label htmlFor="isRegex" className="text-sm">
              使用正则表达式
            </Label>
          </div>
        </div>
        <Input
          id="pattern"
          value={rule.pattern}
          onChange={(e) => handleChange("pattern", e.target.value)}
          required
          placeholder={rule.isRegex ? "/pattern/g" : "要匹配的文本"}
        />
        <p className="text-xs text-muted-foreground">
          {rule.isRegex ? "输入正则表达式，例如：\\b(错误|问题)\\b" : "输入要匹配的文本，将进行精确匹配"}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="errorMessage">错误提示信息</Label>
        <Textarea
          id="errorMessage"
          value={rule.errorMessage}
          onChange={(e) => handleChange("errorMessage", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="suggestion">修改建议</Label>
        <Textarea
          id="suggestion"
          value={rule.suggestion}
          onChange={(e) => handleChange("suggestion", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>严重程度</Label>
        <RadioGroup
          value={rule.severity}
          onValueChange={(value) => handleChange("severity", value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="error" id="severity-error" />
            <Label htmlFor="severity-error" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              错误
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="warning" id="severity-warning" />
            <Label htmlFor="severity-warning" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              警告
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="info" id="severity-info" />
            <Label htmlFor="severity-info" className="flex items-center gap-1">
              <Info className="h-4 w-4 text-blue-500" />
              提示
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">{initialRule ? "更新规则" : "添加规则"}</Button>
      </div>
    </form>
  )
}

// 严重程度图标组件
function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />
    default:
      return null
  }
}
