const mapByAuthor = (key, value) => {
  if (!value.hasOwnProperty('authors')) {
    return [];
  }

  let authors = [];
  // either split authors by ; or ,
  if (value.authors.includes(';')) {
    const group = value.authors.split(';');
    const arr = group.map((part) => {
      elements = part.split(', ');
      return elements[0];
    });
    authors = [...new Set(arr)];
  } else {
    authors = value.authors.split(', ');
  }
  // remove empty strings
  authors = authors.filter((author) => author !== '');

  // some strings contain and or University; need to process further
  const bannedWords = [
    'University',
    'School',
    'Center',
    'Research',
    'Computer Science',
    'College',
  ];
  let processedAuthors = [];

  for (let author of authors) {
    // check if author contains any banned words
    // In some case, returned words still have bad formats,
    // so only keep names with length <= 30
    if (
      !bannedWords.some((bannedWord) => author.includes(bannedWord)) &&
      author.length <= 30
    ) {
      // handle authors separated by 'and'
      if (author.includes(' and ')) {
        let splittedAuthors = author.split(' and ');
        splittedAuthors = splittedAuthors.map((str) => str.replace(/^and\s+/i));
        processedAuthors.push(...splittedAuthors);
      } else {
        processedAuthors.push(author);
      }
    }
  }
  // some authors still have leading 'and ' prefix
  // use a regular expression to match any number of spaces after "and"
  processedAuthors = processedAuthors.map((each) => {
    return each.replace(/^and\s+/, '');
  });

  //filter out empty strings
  authors = processedAuthors.filter((author) => {
    return !/^\s*$/.test(author);
  });
  authors = authors.map((str) => str.trim());

  if (!authors || authors.length === 0) {
    return [];
  }

  let out = [];
  authors.forEach((author) => {
    let result = {};
    result[author] = {
      title: value.title,
      conference: value.conference,
    };
    out.push(result);
  });
  return out;
};

module.exports = {mapByAuthor};
