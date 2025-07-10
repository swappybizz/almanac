// file templedtr/pages/_document.js:
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Link to the manifest file */}
        <link rel="manifest" href="/manifest.json" />
        {/* Meta tags for theme color and mobile support */}
        <meta name="theme-color" content="#000000" />
        {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}