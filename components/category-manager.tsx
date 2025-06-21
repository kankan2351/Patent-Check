"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, X, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface CategoryManagerProps {
  categories: string[]
  onCategoriesChange: (categories: string[]) => void
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function CategoryManager({
  categories,
  onCategoriesChange,
  selectedCategory,
  onSelectCategory,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("")
  const [editingCategory, setEditingCategory] = useState<{ index: number; name: string } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()]
      onCategoriesChange(updatedCategories)
      setNewCategory("")
    }
  }

  const handleDeleteCategory = (index: number) => {
    const updatedCategories = [...categories]
    updatedCategories.splice(index, 1)
    onCategoriesChange(updatedCategories)

    // 如果删除的是当前选中的分类，则重置选中状态
    if (categories[index] === selectedCategory) {
      onSelectCategory("全部")
    }
  }

  const handleEditCategory = () => {
    if (editingCategory && editingCategory.name.trim() && !categories.includes(editingCategory.name.trim())) {
      const updatedCategories = [...categories]
      updatedCategories[editingCategory.index] = editingCategory.name.trim()
      onCategoriesChange(updatedCategories)

      // 如果编辑的是当前选中的分类，则更新选中状态
      if (categories[editingCategory.index] === selectedCategory) {
        onSelectCategory(editingCategory.name.trim())
      }

      setEditingCategory(null)
      setIsDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="新分类名称"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleAddCategory}
          disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <Badge
          variant={selectedCategory === "全部" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onSelectCategory("全部")}
        >
          全部
        </Badge>

        {categories.map((category, index) => (
          <div key={index} className="flex items-center">
            <Badge
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onSelectCategory(category)}
            >
              {category}
            </Badge>
            <div className="flex ml-1">
              <Dialog
                open={isDialogOpen && editingCategory?.index === index}
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) setEditingCategory(null)
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0"
                    onClick={() => {
                      setEditingCategory({ index, name: category })
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>编辑分类</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Input
                        value={editingCategory?.name || ""}
                        onChange={(e) =>
                          setEditingCategory((prev) => (prev ? { ...prev, name: e.target.value } : null))
                        }
                        placeholder="分类名称"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(null)
                          setIsDialogOpen(false)
                        }}
                      >
                        取消
                      </Button>
                      <Button onClick={handleEditCategory}>保存</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0" onClick={() => handleDeleteCategory(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
