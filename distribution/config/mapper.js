const mapByAuthor = (key, value) => {
  let authorarray;
  if (!value.hasOwnProperty('authors')) {
    return [];
  }
  if (value.authors.includes(';')) {
    const group = value.authors.split(';');
    const out = group.map((part) => {
      elements = part.split(', ');
      return elements[0];
    });
    authorarray = [...new Set(out)];
  } else {
    authorarray = value.authors.split(', ');
  }
  authorarray = authorarray.filter((author) => author !== '');
  if (!authorarray || authorarray.length === 0) {
    return [];
  }
  let out = [];
  if (Array.isArray(authorarray)) {
    authorarray.forEach((author) => {
      let result = {};
      result[author] = {
        title: value.title,
        conference: value.conference,
      };
      out.push(result);
    });
  }
  return out;
};

module.exports = {mapByAuthor};
