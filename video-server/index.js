const express = require("express");
const axios = require("axios");
// const cheerio = require("cheerio");
const http = require("http");
const https = require("https");
//const { run } = require('./together');
const dns = require("node:dns"); // Use 'dns' in older Node versions
const { parsePlayerConfig } = require("./playerConfigParser");

const app = express();

const setType = (type) => (response) => {
  response.type = type;
  return response;
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Accept-Ranges, Content-Length, Content-Range, Content-Type",
  );
  next();
});

const searchList = [
  "https://apicollaps.cc/list?token=eedefb541aeba871dcfc756e6b31c02e&name=",
  "https://apivb.info/api/videos.json?token=5e2fe4c70bafd9a7414c4f170ee1b192&title=",
  "https://videocdn.tv/api/short?api_token=6Onb1W1alEUrBcKJZD3GoKBbWyAl2uG2&title=",
];

// 1. Create a new DNS resolver instance
const resolver = new dns.Resolver();
// Set the desired DNS servers (e.g., Google's Public DNS)
resolver.setServers(["8.8.8.8", "8.8.4.4"]);

// 2. Define a custom lookup function
const customLookup = (hostname, options, callback) => {
  // Use the custom resolver to perform DNS resolution
  // This example resolves IPv4 addresses
  resolver.resolve4(hostname, (err, addresses) => {
    if (err) {
      return callback(err);
    }
    // console.log(hostname, 'Found ips: ', addresses);
    // Pass the first resolved address and family (4 or 6) to the callback
    callback(null, addresses[0], 4);
  });
};

axios.defaults.httpAgent = new http.Agent({
  /* localAddress: "46.17.105.181", */
  family: 4,
  lookup: customLookup,
  rejectUnauthorized: false,
});
axios.defaults.httpsAgent = new https.Agent({
  /* localAddress: "46.17.105.181", */
  family: 4,
  lookup: customLookup,
  rejectUnauthorized: false,
});

app.get("/api/search", async (req, res) => {
  try {
    const search = req.query.search;
    const response = [];
    for (let i = 0; i < searchList.length && response.length <= 10; i++) {
      const res = await axios
        .get(searchList[i] + search)
        .catch((err) => console.error(err.message));
      if (!res || !res.data) continue;
      if (i == 0) {
        const data = res.data.results;
        if (Array.isArray(data))
          data.forEach((film) => {
            if (
              !film.kinopoisk_id ||
              response.find((item) => item.id == film.kinopoisk_id)
            )
              return;
            response.push({
              id: film.kinopoisk_id,
              poster: film.poster,
              name: `${film.name} (${film.year})`,
            });
          });
      }
      if (i == 1) {
        const data = res.data;
        if (Array.isArray(data))
          data.forEach((film) => {
            if (
              !film.kinopoisk_id ||
              response.find((item) => item.id == film.kinopoisk_id)
            )
              return;
            response.push({
              id: film.kinopoisk_id,
              poster: film.poster,
              name: `${film.title_ru} (${film.year})`,
            });
          });
      }
      if (i == 2) {
        const data = res.data;
        if (Array.isArray(data))
          data.forEach((film) => {
            if (!film.kp_id || response.find((item) => item.id == film.kp_id))
              return;
            response.push({
              id: film.kp_id,
              poster: `https://st.kp.yandex.net/images/film_iphone/iphone360_${film.kp_id}.jpg`,
              name: film.title,
            });
          });
      }
    }
    res.send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/api/film/:id", async (req, res) => {
  const id = req.params.id;
  const balancers = await Promise.allSettled([
    axios
      .get(
        "https://apicollaps.cc/list?token=eedefb541aeba871dcfc756e6b31c02e&kinopoisk_id=" +
          id,
      )
      .then(setType("collaps")),
    axios.get("https://voidboost.tv/embed/" + id).then(setType("voidboost")),
    axios
      .get(
        "https://api.alloha.tv/?token=04941a9a3ca3ac16e2b4327347bbc1&kp=" + id,
      )
      .then(setType("alloha")),
    axios
      .get(
        "https://videocdn.tv/api/short?api_token=6Onb1W1alEUrBcKJZD3GoKBbWyAl2uG2&kinopoisk_id=" +
          id,
      )
      .then(setType("videocdn")),
    axios
      .get(
        "https://apivb.info/api/videos.json?token=5e2fe4c70bafd9a7414c4f170ee1b192&id_kp=" +
          id,
      )
      .then(setType("hdvb")),
  ]);
  const response = await Promise.all(
    balancers
      .filter((item) => {
        if (item.status == "fulfilled") return true;
        console.log(item.reason?.message);
        return false;
      })
      .map(async (item) => {
        if (item.value.type == "collaps" && item.value.data.results?.length) {
          const iframeUrl = item.value.data.results[0].iframe_url;

          const result = [
            {
              id,
              poster: item.value.data.results[0].poster,
              src: iframeUrl,
              type: item.value.type,
              name: `${item.value.data.results[0].name} (${item.value.data.results[0].year})`,
            },
          ];

          /** @type string */
          const iframeResult = await axios
            .get(iframeUrl)
            .then((res) => res.data)
            .catch((err) => null);

          if (iframeResult) {
            const firstScriptIndex = iframeResult.indexOf('data-name="mk"');
            const firstSymbol = iframeResult.indexOf(">", firstScriptIndex) + 1;
            const endIndex = iframeResult.indexOf("</script", firstSymbol);

            if (
              firstScriptIndex !== -1 &&
              firstSymbol !== 0 &&
              endIndex !== -1
            ) {
              const scriptStr = iframeResult.substring(firstSymbol, endIndex);

              const jsonStart = scriptStr.indexOf("makePlayer({");
              const jsonEnd = scriptStr
                .substring(0, scriptStr.lastIndexOf("videoKey"))
                .lastIndexOf("});");

              if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = scriptStr.substring(
                  jsonStart + "makePlayer({".length - 1,
                  jsonEnd + 1,
                );

                const playerConfig = parsePlayerConfig(jsonStr);

                if (playerConfig) {
                  result.unshift({
                    id,
                    poster: item.value.data.results[0].poster,
                    data: playerConfig,
                    type: "self",
                    name: `${item.value.data.results[0].name} (${item.value.data.results[0].year})`,
                  });
                } else {
                  console.log(`Cant parse playerConfig (length: ${jsonStr.length}): ${jsonStr.substring(0, 50)} ... ${jsonStr.substring(jsonStr.length - 50, jsonStr.length)}`);
                }
              } else {
                console.log(
                  `Cant fount: jsonStart=${jsonStart} jsonEnd=${jsonEnd}`,
                );
              }
            } else {
              console.log(
                `Cant fount: firstScriptIndex=${firstScriptIndex} firstSymbol=${firstSymbol} endIndex=${endIndex}`,
              );
            }
          }

          return result;
        }
        if (item.value.type == "voidboost") {
          return {
            id,
            src: "https://voidboost.tv/embed/" + id,
            type: item.value.type,
          };
        }
        if (item.value.type == "alloha" && item.value.data?.data) {
          return {
            id,
            src: item.value.data?.data.iframe,
            type: item.value.type,
          };
        }
        if (item.value.type == "videocdn" && item.value.data?.data?.length) {
          return {
            id,
            src: "https:" + item.value.data.data[0].iframe_src,
            type: item.value.type,
            name: item.value.data.data[0].title,
          };
        }
        if (item.value.type == "hdvb" && item.value.data?.length) {
          return {
            id,
            poster: item.value.data[0].poster,
            src: item.value.data[0].iframe_url,
            type: item.value.type,
            name: `${item.value.data[0].title_ru} (${item.value.data[0].year})`,
          };
        }
      }),
  ).then((prom) => prom.flat());
  res.send(response);
});

// app.get("/api/proxy", async (req, res) => {
//   try {
//     const url = req.query.url;
//     const urlParams = new URL(url);

//     let response = await axios.get(url);

//     if (response.data && response.data.includes("html")) {
//       const $ = cheerio.load(response.data);
//       $("head").prepend(`<base href="${urlParams.origin}" />`);
//       $('script[data-name="ad"]').remove();
//       $('script:contains("yandex-metrica")').remove();
//       $('noscript:contains("mc.yandex.ru")').remove();
//       response.data = $.html().replace(/adsConfig/g, "({})");
//     }

//     res.status(response.status).send(response.data);
//   } catch (err) {
//     res.sendStatus(500);
//   }
// });

app.get("/api/proxy-stream", async (req, res) => {
  try {
    if (!req.query.url || typeof req.query.url !== "string") {
      return res.status(400).send("Query param 'url' is required");
    }

    const targetUrl = new URL(req.query.url);
    const requestHeaders = {
      origin: "https://api.ortified.ws",
      referer: "https://api.ortified.ws/",
    };
    const forwardedHeaders = [
      "accept",
      "range",
      "if-none-match",
      "if-modified-since",
    ];

    forwardedHeaders.forEach((headerName) => {
      const headerValue = req.get(headerName);

      if (headerValue) {
        requestHeaders[headerName] = headerValue;
      }
    });

    const response = await axios.get(targetUrl.toString(), {
      headers: requestHeaders,
      responseType: "stream",
      validateStatus: () => true,
      decompress: false,
    });
    const responseHeaders = [
      "accept-ranges",
      "cache-control",
      "content-length",
      "content-range",
      "content-type",
      "etag",
      "last-modified",
    ];

    responseHeaders.forEach((headerName) => {
      const headerValue = response.headers[headerName];

      if (headerValue) {
        res.setHeader(headerName, headerValue);
      }
    });

    res.status(response.status);
    response.data.pipe(res);
  } catch (err) {
    console.error("Proxy request failed:", err.message);
    res.sendStatus(500);
  }
});

// const devicesList = [];

// app.post("/api/storeip", async (req, res) => {
//   const { ip, name } = req.query;

//   if (!devicesList.find((device) => device.ip === ip))
//     devicesList.push({ ip, name });

//   console.log("Store ip", { ip, name });

//   res.sendStatus(200);
// });

// app.post("/api/deleteip", async (req, res) => {
//   const { ip } = req.query;

//   const index = devicesList.findIndex((device) => device.ip === ip);

//   if (index > -1) devicesList.splice(index, 1);

//   console.log("Delete ip", ip);

//   res.sendStatus(200);
// });

// app.get("/api/getdevices", async (req, res) => {
//   res.send(devicesList);
// });

app.listen(3030);
//run();
