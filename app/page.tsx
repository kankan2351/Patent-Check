import { PatentChecker } from "@/components/patent-checker"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">专利文本检查工具</h1>
      <p className="text-center text-muted-foreground mb-2">
        检查专利文本中的形式错误，如无引用基础、技术特征与标号不一致等
      </p>
      <p className="text-center text-muted-foreground mb-8">
        支持自动识别文本类型（权利要求书/说明书），自定义规则管理，以及附图标记说明一致性检查
      </p>
      <PatentChecker />
    </main>
  )
}
