## tweet2gif

Did you think it's not possible to download the gifs which you saw on Twitter? It's time to make some changes!

![screenshot](./screenshot.gif)

### Preparation

Since we are not able to bypass Twitter's CSP([Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)), we fist need some browser extensions to modify the `Content-Security-Policy` HTTP response header. The following is the extension that I am using:

- [Content Security Policy Override](https://chrome.google.com/webstore/detail/content-security-policy-o/lhieoncdgamiiogcllfmboilhgoknmpi)
- Rules:
    ```json
    [
      ["https://twitter\\.com/*", [
        ["worker-src|$", "worker-src 'self' blob:;"]
      ]]
    ]
    ```

### Install

OK, now we are ready to install this userscript from either [GitHub](https://github.com/idiotWu/tweet2gif/raw/master/dist/tweet2gif.user.js) or [Greasy Fork](https://greasyfork.org/en/scripts/30818-tweet2gif).

Emmm...you just want to know how to use userscript? Check here: [http://bfy.tw/CV0p](http://bfy.tw/CV0p).

### I Can't See the "Encode GIF" button

Don't panic. There are several ways to activate this script manually:

1. Press `Ctrl+K`
2. Open the devtool and type `analyzeGIF()`

### LICENSE

[MIT](LICENSE)
