#!/bin/sh
# Downloads the open data the content build uses into .cache/content.
set -e
cd "$(dirname "$0")/../.."
mkdir -p .cache/content
cd .cache/content
for u in \
  https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2 \
  https://downloads.tatoeba.org/exports/per_language/heb/heb_sentences_detailed.tsv.bz2 \
  https://downloads.tatoeba.org/exports/per_language/heb/heb-eng_links.tsv.bz2 \
  https://downloads.tatoeba.org/exports/user_languages.tar.bz2 \
  https://kaikki.org/dictionary/Hebrew/kaikki.org-dictionary-Hebrew.jsonl
do
  curl -fsSL -O "$u"
done
bunzip2 -kf eng_sentences.tsv.bz2 heb_sentences_detailed.tsv.bz2 heb-eng_links.tsv.bz2
tar xjf user_languages.tar.bz2
echo "Downloaded to .cache/content"
