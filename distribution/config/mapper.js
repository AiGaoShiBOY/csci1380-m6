const mapByAuthor = (key, value) => {
  let authorarray;
  if (value.authors.includes(';')) {
    const group = message2.split(';');
    const out = group.map((part) => {
      elements = part.split(', ');
      return elements[0];
    });
    authorarray = [...new Set(out)];
  } else {
    authorsArray = value.authors.split(', ');
  }
  let out = [];
  authorsArray.forEach((author) => {
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
