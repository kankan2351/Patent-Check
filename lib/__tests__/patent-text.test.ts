import { describe, expect, it } from "vitest"

import { extractFeatureNumberPairs } from "@/lib/patent-text"

describe("extractFeatureNumberPairs", () => {
  it("finds features that use half-width parentheses", () => {
    const line = "所述固定架(4)与底座(3)相连接"

    expect(extractFeatureNumberPairs(line)).toEqual([
      { feature: "固定架", number: "4" },
      { feature: "底座", number: "3" },
    ])
  })

  it("finds features that use full-width parentheses", () => {
    const line = "连接件（5）固定于支撑板（6）"

    expect(extractFeatureNumberPairs(line)).toEqual([
      { feature: "连接件", number: "5" },
      { feature: "支撑板", number: "6" },
    ])
  })

  it("normalizes leading connectors and verb phrases", () => {
    const line = "所述限位件(2)与所述底座(3)固定连接于所述支撑板（6）"

    expect(extractFeatureNumberPairs(line)).toEqual([
      { feature: "限位件", number: "2" },
      { feature: "底座", number: "3" },
      { feature: "支撑板", number: "6" },
    ])
  })

  it("ignores matches that only contain digits before the number", () => {
    const line = "1(2)所示的标记不会被视为技术特征"

    expect(extractFeatureNumberPairs(line)).toEqual([])
  })
})
