const assert = require('assert');

const parseWikiUrl = require('./util/parseWikiUrl');
const errors = require('./util/errors');

// unescape URL-escaped characters
function formatTitle(title) {
  return decodeURI(title.trim());
}

async function getImageTitles({ client, title, wikiUrl }) {
  const formattedTitle = formatTitle(title);
  const params = { imlimit: 500 };
  const response = await client.getResultsFromApi([formattedTitle], 'images', wikiUrl, params);
  assert.ok(response.pages, errors.emptyResponse);
  const pages = Object.values(response.pages);
  assert.ok(pages.length === 1);
  const { images = [] } = pages[0];

  return images.map(image => image.title);
}

function formatImageInfo(page) {
  const { title, imageinfo } = page;
  const {
    url: rawUrl,
    descriptionurl: descriptionUrl,
    size: fileSize,
    thumburl,
    thumbwidth,
    thumbheight,
  } = imageinfo[0];
  const thumbnail = { rawUrl: thumburl, width: thumbwidth, height: thumbheight };

  return { title, descriptionUrl, rawUrl, fileSize, thumbnail };
}

async function getImageInfos({ client, titles, wikiUrl }) {
  const params = { iiprop: 'url|size', iiurlwidth: 300 };
  const { pages } = await client.getResultsFromApi(titles, 'imageinfo', wikiUrl, params);
  assert.ok(pages, errors.emptyResponse);

  return Object.values(pages).map(formatImageInfo);
}

class Files {
  constructor({ client }) {
    this.client = client;
  }

  async getPageImages(url) {
    const input = decodeURIComponent(url);
    const { title, wikiUrl } = parseWikiUrl(input);
    const { client } = this;
    const titles = await getImageTitles({ client, title, wikiUrl });
    if (titles.length === 0) return [];

    return getImageInfos({ client, titles, wikiUrl });
  }
}

module.exports = Files;
