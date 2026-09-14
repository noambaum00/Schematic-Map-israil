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

test('skips optional files only when decoding fails', async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'gtfs-update-test-'))

  try {
    const invalidTranslationsPath = join(tempDirectory, 'translations-invalid.txt')
    await writeFile(invalidTranslationsPath, Buffer.from([0x00, 0x00, 0x00, 0x00]))

    const skippedTranslations = await parseExtractedFile(new Map([['translations.txt', invalidTranslationsPath]]), 'translations.txt', {
      required: false,
    })

    assert.equal(skippedTranslations, null)

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
