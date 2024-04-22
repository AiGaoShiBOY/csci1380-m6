// const mapByAuthor = (key, value) => {
//   let authorarray;
//   if (!value.hasOwnProperty('authors')) {
//     return [];
//   }
//   if (value.authors.includes(';')) {
//     const group = value.authors.split(';');
//     const out = group.map((part) => {
//       elements = part.split(', ');
//       return elements[0];
//     });
//     authorarray = [...new Set(out)];
//   } else {
//     authorarray = value.authors.split(', ');
//   }
//   authorarray = authorarray.filter((author) => author !== '');
//   if (!authorarray || authorarray.length === 0) {
//     return [];
//   }
//   let out = [];
//   if (Array.isArray(authorarray)) {
//     authorarray.forEach((author) => {
//       let result = {};
//       result[author] = {
//         title: value.title,
//         conference: value.conference,
//       };
//       out.push(result);
//     });
//   }
//   return out;
// };

// module.exports = {mapByAuthor};

// function processAuthors(authorStr) {
//   let authors = [];
//   if (authorStr.includes(';')) {
//     const group = value.authors.split(';');
//     const arr = group.map((part) => {
//       elements = part.split(', ');
//       return elements[0];
//     });
//     authors = [...new Set(arr)];
//   } else {
//     authors = value.authors.split(', ');
//   }
//   authors = authors.filter((author) => author !== '');

//   // some strings contain and or University; need to process further
//   const bannedWords = ['University', 'School', 'Center', 'Research'];
//   let processedAuthors = [];

//   for (let author of authors) {
//     // check if author contains any banned words
//     if (
//       !bannedWords.some((bannedWord) => author.includes(bannedWord)) &&
//       author.length <= 30
//     ) {
//       // handle authors separated by 'and'
//       if (author.includes(' and ')) {
//         let splitAuthors = author.split(' and ');
//         processedAuthors.push(...splitAuthors);
//       } else {
//         processedAuthors.push(author);
//       }
//     }
//   }
// }

const mapByAuthor = (key, value) => {
  if (!value.hasOwnProperty('authors')) {
    return [];
  }

  let authors = [];
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
  authors = authors.filter((author) => author !== '');

  // some strings contain and or University; need to process further
  const bannedWords = ['University', 'School', 'Center', 'Research', 'Computer Science',
  'College'];
  let processedAuthors = [];

  for (let author of authors) {
    // check if author contains any banned words
    if (
      !bannedWords.some((bannedWord) => author.includes(bannedWord)) &&
      author.length <= 30
    ) {
      // handle authors separated by 'and'
      if (author.includes(' and ')) {
        let splitAuthors = author.split(' and ');
        processedAuthors.push(...splitAuthors);
      } else {
        processedAuthors.push(author);
      }
    }
  }

  authors = processedAuthors;


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