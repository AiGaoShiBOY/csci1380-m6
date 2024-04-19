const reduceByAuthor = (key, value) => {
  let out = {};
  let result = {};
  let titles = [];
  let conferencesSet = new Set();
  if (!Array.isArray(value)) {
    value = [value];
  }

  value.forEach((paper) => {
    titles.push(paper.title);
    conferencesSet.add(paper.conference);
  });

  result['numberOfPapers'] = value.length;
  result['titles'] = titles;
  result['conferences'] = [...conferencesSet];
  out[key] = result;
  return out;
};

module.exports = {reduceByAuthor};
