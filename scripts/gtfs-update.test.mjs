import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { buildTranslationMap, decodeGtfsText, getCsvDelimiter, parseCsv, parseExtractedFile } from './gtfs-update.mjs'

test('decodes UTF-16 GTFS files and detects semicolon delimiters', () => {
  const content = 'route_id;route_type\nR1;3\n'
  const decoded = decodeGtfsText(Buffer.from(content, 'utf16le'), 'routes.txt')

  assert.equal(decoded, content)
  assert.equal(getCsvDelimiter(decoded, 'routes.txt'), ';')
  assert.deepEqual(parseCsv(decoded, 'routes.txt'), [{ route_id: 'R1', route_type: '3' }])
})

test('decodes UTF-32LE GTFS files and preserves header validation', () => {
  const content = 'trip_id,stop_id,stop_sequence\nT1,S1,1\n'
  const bytes = [0xff, 0xfe, 0x00, 0x00]

  for (const character of content) {
    const codePoint = character.codePointAt(0)
    bytes.push(codePoint & 0xff, (codePoint >> 8) & 0xff, (codePoint >> 16) & 0xff, (codePoint >> 24) & 0xff)
  }

  const decoded = decodeGtfsText(Buffer.from(bytes), 'stop_times.txt')

  assert.equal(decoded, content)
  assert.deepEqual(parseCsv(decoded, 'stop_times.txt'), [{ trip_id: 'T1', stop_id: 'S1', stop_sequence: '1' }])
})

test('removes embedded NUL characters when headers are valid', () => {
  const contentWithNull = 'trip_id,stop_id,stop_sequence\nT1,S1,\u00001\n'
  const decoded = decodeGtfsText(Buffer.from(contentWithNull, 'utf8'), 'stop_times.txt')

  assert.equal(decoded.includes('\u0000'), false)
  assert.deepEqual(parseCsv(decoded, 'stop_times.txt'), [{ trip_id: 'T1', stop_id: 'S1', stop_sequence: '1' }])
})

test('falls back to windows decoding for non-UTF8 bytes in GTFS rows', () => {
  const bytes = Buffer.from([
    ...Buffer.from('trip_id,stop_id,stop_sequence\nT1,S1,1', 'utf8'),
    0x81,
    0x0a,
  ])

  const decoded = decodeGtfsText(bytes, 'stop_times.txt')

  assert.deepEqual(parseCsv(decoded, 'stop_times.txt'), [{ trip_id: 'T1', stop_id: 'S1', stop_sequence: '1\x81' }])
})

test('parses stop_times and keeps required fields', async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'gtfs-update-test-'))

  try {
    const stopTimesPath = join(tempDirectory, 'stop_times.txt')
    await writeFile(stopTimesPath, 'trip_id;arrival_time;departure_time;stop_id;stop_sequence\nT1;08:00:00;08:00:00;S1;1\n')

    const parsedStopTimes = await parseExtractedFile(new Map([['stop_times.txt', stopTimesPath]]), 'stop_times.txt')

    assert.deepEqual(parsedStopTimes, [{ trip_id: 'T1', stop_id: 'S1', stop_sequence: '1' }])
  } finally {
    await rm(tempDirectory, { force: true, recursive: true })
  }
})

test('parses non-UTF8 stop_times when processed in-memory', async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'gtfs-update-test-'))

  try {
    const stopTimesPath = join(tempDirectory, 'stop_times.txt')
    const bytes = Buffer.from([...Buffer.from('trip_id,stop_id,stop_sequence\nT1,S1,1', 'utf8'), 0x81, 0x0a])
    await writeFile(stopTimesPath, bytes)

    const parsedStopTimes = await parseExtractedFile(new Map([['stop_times.txt', stopTimesPath]]), 'stop_times.txt')

    assert.deepEqual(parsedStopTimes, [{ trip_id: 'T1', stop_id: 'S1', stop_sequence: '1\x81' }])
  } finally {
    await rm(tempDirectory, { force: true, recursive: true })
  }
})

test('stream parser supports multiline quoted stop_times rows', async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'gtfs-update-test-'))
  const previousThreshold = process.env.GTFS_STOP_TIMES_STREAM_THRESHOLD_BYTES

  try {
    process.env.GTFS_STOP_TIMES_STREAM_THRESHOLD_BYTES = '1'
    const stopTimesPath = join(tempDirectory, 'stop_times.txt')
    await writeFile(stopTimesPath, 'trip_id,stop_id,stop_sequence,stop_headsign\nT1,S1,1,"line1\nline2"\n')

    const parsedStopTimes = await parseExtractedFile(new Map([['stop_times.txt', stopTimesPath]]), 'stop_times.txt')

    assert.deepEqual(parsedStopTimes, [{ trip_id: 'T1', stop_id: 'S1', stop_sequence: '1' }])
  } finally {
    if (typeof previousThreshold === 'string') {
      process.env.GTFS_STOP_TIMES_STREAM_THRESHOLD_BYTES = previousThreshold
    } else {
      delete process.env.GTFS_STOP_TIMES_STREAM_THRESHOLD_BYTES
    }

    await rm(tempDirectory, { force: true, recursive: true })
  }
})

test('skips optional translations when headers are unsupported', async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'gtfs-update-test-'))

  try {
    const invalidTranslationsPath = join(tempDirectory, 'translations-invalid.txt')
    await writeFile(invalidTranslationsPath, Buffer.from([0x00, 0x00, 0x00, 0x00]))

    const skippedTranslations = await parseExtractedFile(new Map([['translations.txt', invalidTranslationsPath]]), 'translations.txt', {
      required: false,
    })

    assert.equal(skippedTranslations, null)

    const unsupportedHeaderPath = join(tempDirectory, 'translations-unsupported.txt')
    await writeFile(unsupportedHeaderPath, 'some_field,another_field\nfoo,bar\n')

    const unsupportedTranslations = await parseExtractedFile(new Map([['translations.txt', unsupportedHeaderPath]]), 'translations.txt', {
      required: false,
    })
    assert.equal(unsupportedTranslations, null)

    const malformedTranslationsPath = join(tempDirectory, 'translations-malformed.txt')
    await writeFile(malformedTranslationsPath, 'table_name,field_name,language,translation,record_id\n"broken')

    await assert.rejects(
      () => parseExtractedFile(new Map([['translations.txt', malformedTranslationsPath]]), 'translations.txt', { required: false }),
      /Failed to parse translations\.txt/
    )
  } finally {
    await rm(tempDirectory, { force: true, recursive: true })
  }
})

test('supports both table-based translation header variants', () => {
  const commaDelimited = parseCsv(
    'table_name,field_name,language,translation,record_id\nstops,stop_name,en,Central,S1\n',
    'translations.txt'
  )
  const semicolonDelimited = parseCsv(
    'table_name;field_name;lang;translation;field_value\nstops;stop_name;he;תחנה מרכזית;S1\n',
    'translations.txt'
  )

  const translationMap = buildTranslationMap([...commaDelimited, ...semicolonDelimited])

  assert.deepEqual(translationMap.get('S1'), {
    English: 'Central',
    עברית: 'תחנה מרכזית',
  })
})
