import { describe, expect, it } from "vitest"

import { checkNumberConsistency, type PatentTextType } from "@/components/patent-checker"

describe("checkNumberConsistency", () => {
  const textType: PatentTextType = "claims"

  it("returns no errors when identifiers are used consistently", () => {
    const text = [
      "所述固定架(4)与底座(3)相连接。",
      "所述底座(3)用于支撑整机。",
    ].join("\n")

    expect(checkNumberConsistency(text, textType)).toEqual([])
  })

  it("reports when the same feature uses different identifiers", () => {
    const text = [
      "所述固定架(4)与底座(3)相连接。",
      "所述固定架(5)进一步连接到支撑板。",
    ].join("\n")

    const [error] = checkNumberConsistency(text, textType)
    expect(error).toMatchObject({
      description: expect.stringContaining("技术特征\"固定架\"使用了不一致的标号"),
    })
  })

  it("reports when one identifier is reused for different features", () => {
    const text = [
      "支撑板(4)固定在底座上。",
      "固定架(4)与支撑板连接。",
    ].join("\n")

    const [error] = checkNumberConsistency(text, textType)
    expect(error).toMatchObject({
      description: expect.stringContaining("标号\"4\"被用于不同的技术特征"),
    })
  })
})
