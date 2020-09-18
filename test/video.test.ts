import { decode, encode } from '../src'

describe('video', function() {
  it('works', function() {
    expect(encode({ id: '', sections: [] })).toBeNull()

    const video1 = { id: '00000000000', sections: [] }
    const video1encoded = encode(video1)
    expect(video1encoded).toStrictEqual('4k=Kdg$beQ=&s4C')
    expect(decode(video1encoded ?? '')).toStrictEqual(video1)

    const video2 = { id: '00000000000', sections: [{ start: 0, end: 0 }] }
    const video2encoded = encode(video2)
    expect(video2encoded).toStrictEqual('4k=Kdg$beQ=&:sG')
    expect(decode(video2encoded ?? '')).toStrictEqual(video2)

    const video3 = {
      id: '00000000000',
      sections: [
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
      ],
    }
    const video3encoded = encode(video3)
    expect(video3encoded).toStrictEqual('4k=Kdg$beQ=>(-.')
    expect(decode(video3encoded ?? '')).toStrictEqual(video3)

    const video4 = {
      id: 'abcdefghijk',
      sections: [{ start: 42, end: 8000 }],
    }
    const video4encoded = encode(video4)
    expect(video4encoded).toStrictEqual('2aGR:PmN]PMJNF0kMy=:')
    expect(decode(video4encoded ?? '')).toStrictEqual(video4)

    expect(
      encode({
        id: '5asd2swdaa0',
        sections: [{ start: 42, end: Number.MAX_SAFE_INTEGER }],
      })
    ).toBeNull()

    expect(
      encode({
        id: '5asd2swdaa0',
        sections: [{ start: Number.MAX_SAFE_INTEGER, end: 42 }],
      })
    ).toBeNull()

    expect(decode('')).toBeNull()
    expect(decode(',')).toBeNull()
    expect(decode('0')).toStrictEqual({ id: 'AAAAAAAAAAA', sections: [] })
    expect(decode('000000000')).toStrictEqual({
      id: 'AAAAAAAAAAA',
      sections: [],
    })
  })
})
