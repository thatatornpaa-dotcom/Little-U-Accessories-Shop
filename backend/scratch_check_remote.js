async function main() {
  const url = "https://bareandboldapi.duckdns.org/api/products/dc6ea417-5aed-4c22-8b16-c5e0f010b7f1";
  console.log("Fetching from remote VPS API:", url);
  const res = await fetch(url);
  const data = await res.json();
  console.log("Remote API Status:", res.status);
  console.log("Remote Product Accessories:", JSON.stringify(data.product?.accessories, null, 2));
}

main().catch(console.error);
