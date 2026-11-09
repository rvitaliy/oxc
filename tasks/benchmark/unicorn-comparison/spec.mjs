// Dedicated cases; the runner wraps each entry in a separate function.
export const clean = [
  {
    name: "currency_number_format",
    code: "return new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP', currencyDisplay: 'code'});",
    diagnostics: 0,
  },
  {
    name: "compound_unit_format",
    code: "return new Intl.NumberFormat('en', {style: 'unit', unit: 'kilometer-per-hour', unitDisplay: 'long'});",
    diagnostics: 0,
  },
  {
    name: "date_time_styles",
    code: "return new Intl.DateTimeFormat('it', {dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Rome'});",
    diagnostics: 0,
  },
  {
    name: "collator_options",
    code: "return Intl.Collator('de', {usage: 'sort', sensitivity: 'base', numeric: true});",
    diagnostics: 0,
  },
  {
    name: "language_display_names",
    code: "return new Intl.DisplayNames(['fr'], {type: 'language', style: 'short', languageDisplay: 'standard'});",
    diagnostics: 0,
  },
  {
    name: "digital_duration",
    code: "return new Intl.DurationFormat('en', {style: 'digital', fractionalDigits: 3});",
    diagnostics: 0,
  },
  {
    name: "word_segmentation",
    code: "return new Intl.Segmenter('ja', {granularity: 'word', localeMatcher: 'lookup'});",
    diagnostics: 0,
  },
  {
    name: "numeric_locale_method",
    code: "return (1234.5).toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always'});",
    diagnostics: 0,
  },
  {
    name: "date_locale_method",
    code: "return new Date(0).toLocaleDateString('it', {year: 'numeric', month: 'long', day: '2-digit'});",
    diagnostics: 0,
  },
  {
    name: "string_locale_compare",
    code: "return 'resume'.localeCompare('r\u00e9sum\u00e9', 'fr', {sensitivity: 'accent', ignorePunctuation: true});",
    diagnostics: 0,
  },
];
export const invalid = [
  {
    name: "missing_currency",
    code: "return new Intl.NumberFormat('en', {style: 'currency'});",
    diagnostics: 1,
  },
  {
    name: "date_style_component_conflict",
    code: "return new Intl.DateTimeFormat('en', {dateStyle: 'short', year: 'numeric'});",
    diagnostics: 1,
  },
  {
    name: "invalid_collator_enum",
    code: "return new Intl.Collator('en', {sensitivity: 'unknown'});",
    diagnostics: 1,
  },
  {
    name: "unknown_list_option",
    code: "return new Intl.ListFormat('en', {types: 'conjunction'});",
    diagnostics: 1,
  },
  {
    name: "missing_display_type",
    code: "return new Intl.DisplayNames('en', {});",
    diagnostics: 1,
  },
  {
    name: "duration_unit_style_conflict",
    code: "return new Intl.DurationFormat('en', {hours: 'numeric', minutes: 'long'});",
    diagnostics: 1,
  },
  {
    name: "numeric_locale_digit_range",
    code: "return (1234.5).toLocaleString('en', {maximumFractionDigits: 101});",
    diagnostics: 1,
  },
  {
    name: "date_locale_forbidden_time_style",
    code: "return new Date(0).toLocaleDateString('en', {timeStyle: 'short'});",
    diagnostics: 1,
  },
  {
    name: "string_locale_invalid_usage",
    code: "return 'resume'.localeCompare('r\u00e9sum\u00e9', 'fr', {usage: 'match'});",
    diagnostics: 1,
  },
  {
    name: "supported_locales_matcher",
    code: "return Intl.PluralRules.supportedLocalesOf(['en'], {localeMatcher: 'closest'});",
    diagnostics: 1,
  },
];
export const nonTarget = [
  {
    name: "array_price_pipeline",
    code: "const prices = [12, 0, 8, 25]; return prices.filter(price => price > 0).map(price => price * 1.2);",
    diagnostics: 0,
  },
  {
    name: "object_inventory_total",
    code: "const inventory = {apples: 3, pears: 5}; return Object.entries(inventory).reduce((total, entry) => total + entry[1], 0);",
    diagnostics: 0,
  },
  {
    name: "string_slug_transform",
    code: "const title = '  A Simple Product Name  '; return title.trim().toLowerCase().split(/\\s+/).join('-');",
    diagnostics: 0,
  },
  {
    name: "text_escape_replace",
    code: "const text = '<item>&value</item>'; return text.replace(/[<>&]/g, character => ({'<': '&lt;', '>': '&gt;', '&': '&amp;'}[character]));",
    diagnostics: 0,
  },
  {
    name: "array_group_flatten",
    code: "const groups = [[1, 2], [], [3, 4]]; return groups.flatMap(group => group.map(value => ({value, doubled: value * 2})));",
    diagnostics: 0,
  },
  {
    name: "map_frequency_count",
    code: "const words = ['one', 'two', 'one']; const frequencies = new Map(); for (const word of words) frequencies.set(word, (frequencies.get(word) || 0) + 1); return [...frequencies.entries()];",
    diagnostics: 0,
  },
  {
    name: "json_record_projection",
    code: "const record = JSON.parse('{\"id\":7,\"active\":true}'); return JSON.stringify({id: record.id, state: record.active ? 'active' : 'inactive'});",
    diagnostics: 0,
  },
  {
    name: "object_copy_sort",
    code: "const records = [{name: 'Beta', rank: 2}, {name: 'Alpha', rank: 1}]; return records.map(record => ({...record})).sort((left, right) => left.rank - right.rank);",
    diagnostics: 0,
  },
];
