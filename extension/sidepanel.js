let cachedProblem = null;

document.getElementById("extractBtn").addEventListener("click", async () => {

  const output = document.getElementById("analysis");
  const codeBtn = document.getElementById("codeBtn");
  const codeBlock = document.getElementById("codeBlock");

  output.textContent = "Extracting problem...";
  codeBlock.style.display = "none";
  codeBtn.style.display = "none";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const problem = await chrome.tabs.sendMessage(tab.id, {
    action: "getProblem"
  });

  if (!problem || !problem.description) {
    output.textContent = "Failed to extract problem.";
    return;
  }

  cachedProblem = problem;

  output.textContent = "Analyzing with local AI...";

  const response = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(problem)
  });

  const data = await response.json();

  output.innerHTML = `
    <h3>Explanation</h3>
    <p>${data.explanation}</p>

    <h3>Approach</h3>
    <p>${data.approach}</p>

    <h3>Time Complexity</h3>
    <p>${data.time_complexity}</p>

    <h3>Space Complexity</h3>
    <p>${data.space_complexity}</p>
  `;

  codeBtn.style.display = "block";
});


document.getElementById("codeBtn").addEventListener("click", async () => {

  const codeBlock = document.getElementById("codeBlock");
  codeBlock.textContent = "Generating C++ solution...";
  codeBlock.style.display = "block";

  const response = await fetch("http://127.0.0.1:8000/generate-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cachedProblem)
  });

  const data = await response.json();

  codeBlock.textContent = data.code;

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

await chrome.tabs.sendMessage(tab.id, {
  action: "pasteCode",
  code: data.code
});
});