const express = require('express');
const axios = require('axios');
//const { run } = require('./together');

const app = express();

const setType = (type) => (response) => {
  response.type = type;
  return response;
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

const searchList = [
  "https://apicollaps.cc/list?token=eedefb541aeba871dcfc756e6b31c02e&name=",
  "https://apivb.info/api/videos.json?token=5e2fe4c70bafd9a7414c4f170ee1b192&title=",
  "https://videocdn.tv/api/short?api_token=6Onb1W1alEUrBcKJZD3GoKBbWyAl2uG2&title="
]

app.get('/search', async (req, res) => {
  try {
    const search = req.query.search;
    const response = [];
    for (let i = 0; i < searchList.length && response.length <= 10; i++) {
      const res = await axios.get(searchList[i] + search);
      if (i == 0) {
        const data = res.data.results;
        if (Array.isArray(data)) data.forEach((film) => {
          if (!film.kinopoisk_id || response.find((item) => item.id == film.kinopoisk_id)) return;
          response.push({
            id: film.kinopoisk_id,
            poster: film.poster,
            name: `${film.name} (${film.year})`
          })
        })
      }
      if (i == 1) {
        const data = res.data;
        if (Array.isArray(data)) data.forEach((film) => {
          if (!film.kinopoisk_id || response.find((item) => item.id == film.kinopoisk_id)) return;
          response.push({
            id: film.kinopoisk_id,
            poster: film.poster,
            name: `${film.title_ru} (${film.year})`
          })
        })
      }
      if (i == 2) {
        const data = res.data;
        if (Array.isArray(data)) data.forEach((film) => {
          if (!film.kp_id || response.find((item) => item.id == film.kp_id)) return;
          response.push({
            id: film.kp_id,
            poster: null,
            name: film.title
          })
        })
      }
    }
    res.send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/film/:id', async (req, res) => {
  const id = req.params.id;
  const response = [];
  const balancers = await Promise.allSettled([
    axios.get('https://apicollaps.cc/list?token=eedefb541aeba871dcfc756e6b31c02e&kinopoisk_id=' + id).then(setType('collaps')),
    axios.get('https://voidboost.tv/embed/' + id).then(setType('voidboost')),
    axios.get('https://videocdn.tv/api/short?api_token=6Onb1W1alEUrBcKJZD3GoKBbWyAl2uG2&kinopoisk_id=' + id).then(setType('videocdn')),
    axios.get('https://apivb.info/api/videos.json?token=5e2fe4c70bafd9a7414c4f170ee1b192&id_kp=' + id).then(setType('hdvb'))
  ]);
  balancers.forEach((item) => {
    if (item.status == 'fulfilled') {
      if (item.value.type == 'collaps' && item.value.data.results.length) {
        response.push({ id, poster: item.value.data.results[0].poster, src: item.value.data.results[0].iframe_url, type: item.value.type, name: `${item.value.data.results[0].name} (${item.value.data.results[0].year})` });
      }
      if (item.value.type == 'voidboost') {
        response.push({ id, src: 'https://voidboost.tv/embed/' + id, type: item.value.type });
      }
      if (item.value.type == 'videocdn' && item.value.data.data.length) {
        response.push({ id, src: item.value.data.data[0].iframe_src, type: item.value.type, name: item.value.data.data[0].title });
      }
      if (item.value.type == 'hdvb' && item.value.data.length) {
        response.push({ id, poster: item.value.data[0].poster, src: item.value.data[0].iframe_url, type: item.value.type, name: `${item.value.data[0].title_ru} (${item.value.data[0].year})` });
      }
    }
  });
  res.send(response);
});

app.listen(3030);
//run();