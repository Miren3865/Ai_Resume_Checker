const natural = require('natural');
const { removeStopwords } = require('stopword');

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Preprocess text: lowercase, remove punctuation, tokenize,
 * remove stopwords, stem
 */
const preprocessText = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  const noPunct = lower.replace(/[^\w\s]/g, ' ').replace(/\d+/g, ' ');
  const tokens = tokenizer.tokenize(noPunct) || [];
  const noStop = removeStopwords(tokens);
  return noStop.map((t) => stemmer.stem(t));
};

/**
 * Build TF-IDF term frequency map for a document
 */
const buildTfVector = (tokens) => {
  const freq = {};
  tokens.forEach((t) => {
    freq[t] = (freq[t] || 0) + 1;
  });
  const total = tokens.length || 1;
  const tf = {};
  Object.keys(freq).forEach((k) => {
    tf[k] = freq[k] / total;
  });
  return tf;
};

/**
 * Build IDF from a list of documents (token arrays)
 */
const buildIdf = (documents) => {
  const idf = {};
  const N = documents.length;
  documents.forEach((doc) => {
    const unique = new Set(doc);
    unique.forEach((term) => {
      idf[term] = (idf[term] || 0) + 1;
    });
  });
  Object.keys(idf).forEach((term) => {
    idf[term] = Math.log((N + 1) / (idf[term] + 1)) + 1; // smoothed IDF
  });
  return idf;
};

/**
 * Build TF-IDF vector for a document given TF and IDF
 */
const buildTfIdfVector = (tf, idf) => {
  const tfidf = {};
  Object.keys(tf).forEach((term) => {
    tfidf[term] = tf[term] * (idf[term] || 1);
  });
  return tfidf;
};

/**
 * Compute cosine similarity between two TF-IDF vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  allTerms.forEach((term) => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
};

/**
 * Compute TF-IDF cosine similarity between two text documents
 */
const computeTextSimilarity = (textA, textB) => {
  const tokensA = preprocessText(textA);
  const tokensB = preprocessText(textB);

  const idf = buildIdf([tokensA, tokensB]);
  const tfA = buildTfVector(tokensA);
  const tfB = buildTfVector(tokensB);

  const tfidfA = buildTfIdfVector(tfA, idf);
  const tfidfB = buildTfIdfVector(tfB, idf);

  return cosineSimilarity(tfidfA, tfidfB);
};

module.exports = {
  preprocessText,
  buildTfVector,
  buildIdf,
  buildTfIdfVector,
  cosineSimilarity,
  computeTextSimilarity,
};
