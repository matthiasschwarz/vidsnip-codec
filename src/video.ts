import { BitSet } from 'bitset'
import { decode as decodeFromZ85, encode as encodeToZ85 } from 'z85-codec'
import { atob, fromUint8Array } from 'js-base64'

export interface Section {
  start: number
  end: number
}

export interface Video {
  id: string
  sections: Array<Section>
}

const VIDEO_ID_LENGTH = 11
const VIDEO_ID_BASE65_BIT_SIZE = 64
const VIDEO_ID_BASE65_REPLACE = [
  ['-', '+'],
  ['_', '/'],
]

const TYPE_BIT_SIZE = 4
const ID_BIT_SIZE = VIDEO_ID_BASE65_BIT_SIZE
const SECONDS_BIT_SIZE_BIT_SIZE = 4

const SECONDS_MIN_BIT_SIZE = 6
const SECONDS_MAX_BIT_SIZE = 21

const SECTIONS_LENGTH_BIT_SIZE = 6

export function encode(video: Video): string | null {
  if (video.id.length !== VIDEO_ID_LENGTH) return null
  const binaryId = Array.from(
    atob(
      VIDEO_ID_BASE65_REPLACE.reduce(
        (id, value) => id.replace(new RegExp(value[0], 'g'), value[1]),
        video.id
      )
    )
  )
    .map(value =>
      value
        .charCodeAt(0)
        .toString(2)
        .padStart(8, '0')
    )
    .join('')
  const bitSet = new BitSet()
  let bitOffset = 0

  // type is zero as there it is the only type so far
  bitOffset += TYPE_BIT_SIZE
  bitSet.setBinaryString(bitOffset, binaryId)
  bitOffset += ID_BIT_SIZE

  if (video.sections.length !== 0) {
    let secondsBitSize = 0
    for (let i = 0; i < video.sections.length; ++i) {
      const section = video.sections[i]
      const start = section.start.toString(2).length
      if (start > secondsBitSize) {
        if (start > SECONDS_MAX_BIT_SIZE) return null
        secondsBitSize = start
      }
      const end = section.end.toString(2).length
      if (end > secondsBitSize) {
        if (end > SECONDS_MAX_BIT_SIZE) return null
        secondsBitSize = end
      }
    }

    if (secondsBitSize < SECONDS_MIN_BIT_SIZE)
      secondsBitSize = SECONDS_MIN_BIT_SIZE

    bitSet.setNumber(
      bitOffset,
      secondsBitSize - SECONDS_MIN_BIT_SIZE,
      SECONDS_BIT_SIZE_BIT_SIZE
    )
    bitOffset += SECONDS_BIT_SIZE_BIT_SIZE
    bitSet.setNumber(bitOffset, video.sections.length, SECTIONS_LENGTH_BIT_SIZE)
    bitOffset += SECTIONS_LENGTH_BIT_SIZE

    for (let i = 0; i < video.sections.length; ++i) {
      const section = video.sections[i]
      bitSet.setNumber(bitOffset, section.start, secondsBitSize)
      bitOffset += secondsBitSize
      bitSet.setNumber(bitOffset, section.end, secondsBitSize)
      bitOffset += secondsBitSize
    }
  }

  const bitSize = Math.ceil(bitSet.size / 8) * 8
  if (bitSet.size !== bitSize) bitSet.resize(bitSize)

  let bytes = bitSet.toUint8Array()
  let i = bytes.length - 1
  for (; i > 3; --i) if (bytes[i] !== 0) break
  const size = Math.ceil((i + 1) / 4) * 4
  if (bytes.length !== size) {
    const newBytes = new Uint8Array(size)
    for (let j = 0; j < bytes.length && j < size; ++j) newBytes[j] = bytes[j]
    bytes = newBytes
  }
  return encodeToZ85(bytes)!!.replace(new RegExp('([0]+)$', 'g'), '')
}

export function decode(value: string): Video | null {
  value = value.padEnd(Math.ceil(value.length / 5) * 5, '0')
  const decoded: Uint8Array | null = decodeFromZ85(value)
  if (decoded === null) return null
  const bitSet = BitSet.fromUint8Array(decoded)
  let bitOffset = 0
  const type: number | undefined = bitSet
    .slice(bitOffset, bitOffset + TYPE_BIT_SIZE - 1)
    ?.toNumber()
  if (type === undefined || isNaN(type) || type !== 0) return null
  bitOffset += TYPE_BIT_SIZE
  const id: Uint8Array = bitSet
    .slice(bitOffset, bitOffset + ID_BIT_SIZE - 1)!!
    .toUint8Array()
  bitOffset += ID_BIT_SIZE
  const idBase64 = VIDEO_ID_BASE65_REPLACE.reduce(
    (id, value) => id.replace(new RegExp('\\' + value[1], 'g'), value[0]),
    fromUint8Array(id).replace(new RegExp('=', 'g'), '')
  )
  let secondsBitSize: number | undefined = bitSet
    .slice(bitOffset, bitOffset + SECONDS_BIT_SIZE_BIT_SIZE - 1)
    ?.toNumber()
  if (secondsBitSize === undefined || isNaN(secondsBitSize))
    return { id: idBase64, sections: [] }
  secondsBitSize += SECONDS_MIN_BIT_SIZE
  bitOffset += SECONDS_BIT_SIZE_BIT_SIZE
  const sectionsLength: number = bitSet
    .slice(bitOffset, bitOffset + SECTIONS_LENGTH_BIT_SIZE - 1)!!
    .toNumber()
  bitOffset += SECTIONS_LENGTH_BIT_SIZE
  const video: Video = {
    id: idBase64,
    sections: new Array<Section>(sectionsLength),
  }
  for (let i = 0; i < sectionsLength; ++i) {
    const start =
      bitSet.slice(bitOffset, bitOffset + secondsBitSize - 1)?.toNumber() ?? 0
    bitOffset += secondsBitSize
    const end =
      bitSet.slice(bitOffset, bitOffset + secondsBitSize - 1)?.toNumber() ?? 0
    bitOffset += secondsBitSize
    video.sections[i] = { start, end }
  }
  return video
}
