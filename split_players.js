// 将 players.js 按球员 ID 拆分为独立 JSON 文件到 public/data/players/
// 运行: node split_players.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import vm from 'vm'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcFile = path.join(__dirname, 'src/data/players.js')
const outDir = path.join(__dirname, 'public/data/players')

// 确保输出目录存在
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
} else {
  const old = fs.readdirSync(outDir)
  for (const f of old) fs.unlinkSync(path.join(outDir, f))
}

const content = fs.readFileSync(srcFile, 'utf8')

// 提取 export const playerDetails = { ... } 部分
// 找到开始和结束位置
const startMarker = 'export const playerDetails = '
const startIdx = content.indexOf(startMarker)
if (startIdx === -1) {
  console.error('找不到 playerDetails 导出')
  process.exit(1)
}

// 从 startMarker 之后开始，找到匹配的结束大括号
let braceCount = 0
let inString = false
let stringChar = ''
let objStart = -1
const codeStart = startIdx + startMarker.length

for (let i = codeStart; i < content.length; i++) {
  const ch = content[i]
  if (inString) {
    if (ch === stringChar && content[i - 1] !== '\\') inString = false
    continue
  }
  if (ch === "'" || ch === '"' || ch === '`') {
    inString = true
    stringChar = ch
    continue
  }
  if (ch === '{') {
    if (objStart === -1) objStart = i
    braceCount++
  }
  if (ch === '}') {
    braceCount--
    if (braceCount === 0) {
      // 找到结束位置
      const objCode = content.substring(objStart, i + 1)
      const sandbox = {}
      vm.runInNewContext(`result = ${objCode}`, sandbox)
      const playerDetails = sandbox.result

      const ids = Object.keys(playerDetails)
      console.log(`找到 ${ids.length} 个球员，开始拆分...`)

      for (const id of ids) {
        const jsonPath = path.join(outDir, `${id}.json`)
        fs.writeFileSync(jsonPath, JSON.stringify(playerDetails[id]), 'utf8')
      }

      console.log(`已生成 ${ids.length} 个 JSON 文件到 public/data/players/`)

      // 生成新的 src/data/players.js
      const newIndex = `// 2026 美加墨世界杯球员详情数据索引
// 数据来源：懂球帝 (dongqiudi.com)
// 更新时间：${new Date().toISOString().split('T')[0]}
// 每个球员的详细数据存储在 public/data/players/ 目录下，按需 fetch 加载

// 根据 personId 异步加载球员详情
export const getPlayerDetailById = async (personId) => {
  if (!personId) return null
  try {
    const res = await fetch(\`/data/players/\${personId}.json\`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
`

      fs.writeFileSync(srcFile, newIndex, 'utf8')
      console.log('已更新 src/data/players.js 为 fetch 异步加载版本')
      console.log(`原文件大小: ${(Buffer.byteLength(content) / 1024 / 1024).toFixed(2)} MB`)
      console.log(`新文件大小: ${(Buffer.byteLength(newIndex) / 1024).toFixed(1)} KB`)
      process.exit(0)
    }
  }
}

console.error('无法找到 playerDetails 对象的结束位置')
process.exit(1)
