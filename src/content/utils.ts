export function $x(xpath: string, context: Node = document): Node[] {
  const result: Node[] = []
  const query = document.evaluate(xpath, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0; i < query.snapshotLength; i++) {
    const node = query.snapshotItem(i)
    if (node)
      result.push(node)
  }
  return result
}

export function formatNameWithUppercaseLastName(fullName: string): string {
  if (!fullName)
    return ''

  const parts = fullName.trim().split(' ')
  if (parts.length === 0)
    return ''

  const lastName = parts[parts.length - 1].toUpperCase()
  const firstNames = parts.slice(0, -1).join(' ')

  return firstNames ? `${firstNames} ${lastName}` : lastName
}
