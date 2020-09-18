# vidsnip-codec

[![Coverage Status](https://coveralls.io/repos/github/matthiasschwarz/vidsnip-codec/badge.svg?branch=master)](https://coveralls.io/github/matthiasschwarz/vidsnip-codec?branch=master)

> Codec used by the vidsnip project to let users share their edited videos

## Specification

Bit size | Description
--- | ---
4 | format type
depends on type | payload

#### Type 0

> Single video with sections of fixed bit size depending on the bit size of the highest seconds in a section

Bit size | Description
--- | ---
64 | youtube video id
4 (optional) | bit size of the seconds in a section (value is increased by 6)
6 (optional) | number of sections
number of sections * bit size of the seconds in a section * 2 | section object (start in seconds, end in seconds)

Trailing zeros are truncated.

## License

Licensed under the [MIT](LICENSE) License.