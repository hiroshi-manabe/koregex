import { CACHE_VERSION } from "./src/cache-version.js?v=2026-05-23-2";

const { expandKoregex } = await import(`./src/expand.js?v=${CACHE_VERSION}`);

const source = document.querySelector("#source");
const output = document.querySelector("#output");
const status = document.querySelector("#status");
const copy = document.querySelector("#copy");
const examples = document.querySelectorAll("[data-example]");

function convert() {
  try {
    output.value = expandKoregex(source.value);
    status.textContent = "Ready";
    status.classList.remove("error");
    copy.disabled = output.value.length === 0;
  } catch (error) {
    output.value = "";
    status.textContent = error.message;
    status.classList.add("error");
    copy.disabled = true;
  }
}

async function copyOutput() {
  if (output.value.length === 0) {
    return;
  }

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(output.value);
    } else {
      output.select();
      document.execCommand("copy");
      output.setSelectionRange(0, 0);
    }
    status.textContent = "Copied";
    status.classList.remove("error");
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  }
}

source.addEventListener("input", convert);
copy.addEventListener("click", copyOutput);

for (const example of examples) {
  example.addEventListener("click", () => {
    source.value = example.dataset.example;
    convert();
    source.focus();
  });
}

convert();
