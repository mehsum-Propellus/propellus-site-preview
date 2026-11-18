#!/usr/bin/env python3
"""Make the Amplify artifact crawlable while GitHub previews stay noindex."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET
import zipfile


class PageMetadata(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.robot_tags = []
        self.canonicals = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot', 'bingbot'):
            self.robot_tags.append(self.get_starttag_text())
        if tag == 'link' and attrs.get('rel', '').lower() == 'canonical':
            self.canonicals.append(attrs.get('href', ''))


def finalize(archive):
    with zipfile.ZipFile(archive) as source:
        entries = {item.filename: source.read(item) for item in source.infolist() if not item.is_dir()}
    if 'index.html' not in entries:
        raise ValueError('Production archive must have index.html at its root')
    pages = sorted(name for name in entries if name.endswith('.html'))
    urls = []
    for name in pages:
        text = entries[name].decode('utf-8')
        metadata = PageMetadata(text)
        if len(metadata.canonicals) != 1:
            raise ValueError(f'{name}: expected one canonical URL')
        canonical = metadata.canonicals[0]
        expected = 'https://propellus.ai/' + ('' if name == 'index.html' else name)
        if canonical != expected:
            raise ValueError(f'{name}: canonical does not match its production path')
        for tag in metadata.robot_tags:
            text = text.replace(tag, '')
        text = text.replace('</head>', '<meta name="robots" content="index, follow"/></head>', 1)
        if not PageMetadata(text).robot_tags:
            raise ValueError(f'{name}: could not add production robots directive')
        entries[name] = text.encode('utf-8')
        urls.append(canonical)
    entries['robots.txt'] = b'User-agent: *\nAllow: /\n\nSitemap: https://propellus.ai/sitemap.xml\n'
    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    sitemap = ET.Element(f'{{{namespace}}}urlset')
    for url in sorted(set(urls)):
        entry = ET.SubElement(sitemap, f'{{{namespace}}}url')
        ET.SubElement(entry, f'{{{namespace}}}loc').text = url
    entries['sitemap.xml'] = ET.tostring(sitemap, encoding='utf-8', xml_declaration=True)
    with tempfile.NamedTemporaryFile(dir=archive.parent, suffix='.zip', delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        with zipfile.ZipFile(temporary_path, 'w', zipfile.ZIP_DEFLATED) as output:
            for name, content in entries.items():
                output.writestr(name, content)
        temporary_path.replace(archive)
    finally:
        temporary_path.unlink(missing_ok=True)
    print(f'Production artifact: {len(pages)} crawlable pages, {len(urls)} sitemap entries; preview sources unchanged.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path)
    finalize(parser.parse_args().archive)
