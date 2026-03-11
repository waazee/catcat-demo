import { useEffect, useMemo, useRef, useState } from 'react'

type SceneMode = 'home' | 'quick'
type PhotoStatus = 'generating' | 'ready' | 'claimed'
type ChatRole = 'user' | 'assistant'

type FurnitureTemplate = {
  id: string
  name: string
  category: string
  style: string
  reason: string
  zone: PlacementZone
  tone: string
  accent: string
  size: 'sm' | 'md' | 'lg'
}

type FurnitureItem = FurnitureTemplate & {
  placementId: string
  source: 'starter' | 'recommendation' | 'photo' | 'assistant'
}

type PhotoItem = {
  id: string
  name: string
  status: PhotoStatus
  tone: string
  accent: string
  category: string
}

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
}

type PlacementZone = 'center' | 'leftWall' | 'rightWall' | 'window' | 'bedside' | 'foot'

type Placement = {
  id: string
  zone: PlacementZone
  left: string
  top: string
  width: string
  depth: string
  rotate: string
}

const PLACEMENTS: Placement[] = [
  { id: 'bed-center', zone: 'center', left: '31%', top: '40%', width: '28%', depth: '19%', rotate: '-18deg' },
  { id: 'bedside-left', zone: 'bedside', left: '21%', top: '43%', width: '10%', depth: '10%', rotate: '-15deg' },
  { id: 'bedside-right', zone: 'bedside', left: '58%', top: '45%', width: '10%', depth: '10%', rotate: '-15deg' },
  { id: 'left-wall-low', zone: 'leftWall', left: '14%', top: '56%', width: '16%', depth: '12%', rotate: '-14deg' },
  { id: 'left-wall-high', zone: 'leftWall', left: '17%', top: '31%', width: '15%', depth: '11%', rotate: '-14deg' },
  { id: 'right-wall-low', zone: 'rightWall', left: '67%', top: '54%', width: '16%', depth: '12%', rotate: '-20deg' },
  { id: 'right-wall-high', zone: 'rightWall', left: '64%', top: '32%', width: '15%', depth: '11%', rotate: '-20deg' },
  { id: 'window-bench', zone: 'window', left: '45%', top: '24%', width: '18%', depth: '10%', rotate: '-18deg' },
  { id: 'foot-center', zone: 'foot', left: '40%', top: '61%', width: '20%', depth: '12%', rotate: '-18deg' },
]

const STARTER_FURNITURE: FurnitureItem[] = [
  {
    id: 'starter-bed',
    name: '\u4e91\u6735\u8f6f\u5e8a',
    category: '\u5e8a',
    style: '\u5976\u6cb9\u539f\u6728',
    reason: '\u9996\u9875\u9ed8\u8ba4\u6838\u5fc3\u5bb6\u5177',
    zone: 'center',
    tone: '#f5f0d8',
    accent: '#97f169',
    size: 'lg',
    placementId: 'bed-center',
    source: 'starter',
  },
  {
    id: 'starter-window',
    name: '\u6696\u5149\u843d\u5730\u706f',
    category: '\u706f\u5177',
    style: '\u6696\u611f\u6c1b\u56f4',
    reason: '\u9996\u9875\u9ed8\u8ba4\u6c1b\u56f4\u5149',
    zone: 'rightWall',
    tone: '#ffe39d',
    accent: '#112824',
    size: 'sm',
    placementId: 'right-wall-high',
    source: 'starter',
  },
]

const RECOMMENDATION_POOL: FurnitureTemplate[] = [
  { id: 'nightstand', name: '\u5706\u89d2\u5e8a\u5934\u67dc', category: '\u5e8a\u5934\u67dc', style: '\u5976\u6cb9\u539f\u6728', reason: '\u8865\u9f50\u5e8a\u8fb9\u6536\u7eb3', zone: 'bedside', tone: '#f3d7b6', accent: '#112824', size: 'sm' },
  { id: 'curtain', name: '\u67d4\u7eb1\u7a97\u5e18', category: '\u7a97\u5e18', style: '\u8f7b\u900f\u6e29\u67d4', reason: '\u8ba9\u623f\u95f4\u66f4\u67d4\u548c', zone: 'window', tone: '#eef8ef', accent: '#97f169', size: 'md' },
  { id: 'rug', name: '\u4e91\u611f\u5730\u6bef', category: '\u5730\u6bef', style: '\u6696\u611f\u5c42\u6b21', reason: '\u586b\u8865\u5e8a\u5c3e\u7a7a\u533a', zone: 'foot', tone: '#f9e7c8', accent: '#97f169', size: 'lg' },
  { id: 'desk', name: '\u6f02\u6d6e\u4e66\u684c', category: '\u4e66\u684c', style: '\u8f7b\u5b66\u4e60\u89d2', reason: '\u5b8c\u5584\u5b66\u4e60\u533a', zone: 'leftWall', tone: '#d7f3df', accent: '#112824', size: 'md' },
  { id: 'chair', name: '\u8c46\u8c46\u5355\u6905', category: '\u6905\u5b50', style: '\u8f7b\u677e\u966a\u4f34', reason: '\u7ed9\u4e66\u684c\u914d\u5ea7\u4f4d', zone: 'leftWall', tone: '#ffe4c2', accent: '#112824', size: 'sm' },
  { id: 'plant', name: '\u732b\u8584\u8377\u7eff\u690d', category: '\u7eff\u690d', style: '\u81ea\u7136\u70b9\u7f00', reason: '\u7ed9\u89d2\u843d\u589e\u52a0\u751f\u547d\u529b', zone: 'window', tone: '#d2f6c9', accent: '#0b3e35', size: 'sm' },
  { id: 'wardrobe', name: '\u62fc\u8272\u8863\u67dc', category: '\u8863\u67dc', style: '\u6574\u6d01\u6536\u7eb3', reason: '\u8865\u9f50\u6536\u7eb3\u5927\u4ef6', zone: 'rightWall', tone: '#d9f1da', accent: '#112824', size: 'lg' },
  { id: 'art', name: '\u6302\u753b\u7ec4\u5408', category: '\u88c5\u9970\u753b', style: '\u8f7b\u827a\u672f\u611f', reason: '\u8865\u8db3\u5899\u9762\u5c42\u6b21', zone: 'leftWall', tone: '#e8f7c3', accent: '#112824', size: 'sm' },
  { id: 'bench', name: '\u5e8a\u5c3e\u957f\u51f3', category: '\u957f\u51f3', style: '\u9152\u5e97\u611f', reason: '\u63d0\u5347\u5b8c\u6574\u5ea6', zone: 'foot', tone: '#ead8b2', accent: '#112824', size: 'md' },
  { id: 'dresser', name: '\u5976\u6cb9\u68b3\u5986\u53f0', category: '\u68b3\u5986\u53f0', style: '\u5c11\u5973\u611f', reason: '\u589e\u52a0\u7cbe\u81f4\u4f7f\u7528\u533a', zone: 'rightWall', tone: '#fae7df', accent: '#112824', size: 'md' },
]

const PHOTO_SAMPLES = [
  '\u9a6c\u514b\u676f\u8fb9\u684c',
  '\u884c\u674e\u7bb1\u77ee\u67dc',
  '\u8033\u673a\u6536\u7eb3\u67b6',
  '\u7f16\u7ec7\u7bee\u7f6e\u7269\u51f3',
  '\u9999\u85b0\u89d2\u51e0',
  '\u73a9\u5076\u62b1\u6795\u51f3',
]

const QUICK_CHIPS = ['\u6362\u6210\u5976\u6cb9\u98ce', '\u52a0\u4e00\u4e2a\u4e66\u684c', '\u628a\u5e8a\u9760\u5899', '\u7a97\u5e18\u6362\u6d45\u4e00\u70b9', '\u8ba9\u623f\u95f4\u66f4\u6e29\u99a8']

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function pickPlacements(zone: PlacementZone, usedIds: Set<string>) {
  return PLACEMENTS.filter((placement) => placement.zone === zone && !usedIds.has(placement.id))
}

function choosePlacement(zone: PlacementZone, usedIds: Set<string>) {
  const candidates = pickPlacements(zone, usedIds)
  return candidates[0] ?? PLACEMENTS.find((placement) => !usedIds.has(placement.id)) ?? null
}

function buildRecommendations(scene: FurnitureItem[], count = 3) {
  const existingCategories = new Set(scene.map((item) => item.category))
  const byPriority = [...RECOMMENDATION_POOL].sort((left, right) => {
    const leftMissing = existingCategories.has(left.category) ? 1 : 0
    const rightMissing = existingCategories.has(right.category) ? 1 : 0
    return leftMissing - rightMissing
  })

  const selected: FurnitureTemplate[] = []
  const usedCategories = new Set<string>()

  for (const item of byPriority) {
    if (selected.length >= count) {
      break
    }
    if (usedCategories.has(item.category)) {
      continue
    }
    selected.push(item)
    usedCategories.add(item.category)
  }

  return selected
}

export default App
