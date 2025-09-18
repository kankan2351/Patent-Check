export interface FeatureNumberPair {
  feature: string
  number: string
}

const PARENTHESIZED_FEATURE_PATTERN = /([^()（）]+)[（(](\d+)[)）]/g

const LEADING_PUNCTUATION = /^[、，,.;:：\s-]+/u
const LEADING_ADVERB = /^(?:进一步地|进一步)/u
const LEADING_CONNECTOR = /^(?:与|及|和|并且|并|或|以及|且)(?:所述|该|上述|本)?/u
const LEADING_DETERMINER = /^(?:所述的?|该|上述|本)/u
const LEADING_VERB_PHRASE =
  /^(?:固定(?:连接|接)?(?:于|在|到|至)(?:所述)?|安装(?:于|在|到)(?:所述)?|设置(?:于|在|到|至)(?:所述)?|连接(?:于|到|在|至)(?:所述)?|布置(?:于|在|到)(?:所述)?|支撑(?:于|在)(?:所述)?|耦合(?:于|到|在)(?:所述)?|耦接(?:于|到|在)(?:所述)?|附着(?:于|在|到)(?:所述)?|附接(?:于|在|到)(?:所述)?|设(?:于|在)(?:所述)?|位于|形成(?:于|在)(?:所述)?|延伸(?:至|到|向|自|出)(?:所述)?)/u

function normalizeFeature(feature: string): string {
  let normalized = feature.trim()

  if (!normalized) {
    return normalized
  }

  let previous: string

  do {
    previous = normalized
    normalized = normalized.replace(LEADING_PUNCTUATION, "")
    normalized = normalized.replace(LEADING_ADVERB, "")
    normalized = normalized.replace(LEADING_CONNECTOR, "")
    normalized = normalized.replace(LEADING_DETERMINER, "")
    normalized = normalized.replace(LEADING_VERB_PHRASE, "")
    normalized = normalized.trim()
  } while (normalized && normalized !== previous)

  return normalized
}

export function extractFeatureNumberPairs(line: string): FeatureNumberPair[] {
  const matches: FeatureNumberPair[] = []

  if (!line) {
    return matches
  }

  for (const match of line.matchAll(PARENTHESIZED_FEATURE_PATTERN)) {
    const rawFeature = match[1] ?? ""
    const trailingFeature = rawFeature.match(/([^\s、，,.:：-]+)$/u)?.[1] ?? rawFeature
    const cleanedFeature = trailingFeature.trim()
    const normalizedFeature = normalizeFeature(cleanedFeature)
    const feature = normalizedFeature || cleanedFeature
    const number = match[2]

    if (!feature || !number) {
      continue
    }

    // Skip entries that are only numeric noise such as "1(2)"
    if (/^\d+$/.test(feature.replace(/[\s、，,.:：-]/g, ""))) {
      continue
    }

    matches.push({
      feature,
      number,
    })
  }

  return matches
}
