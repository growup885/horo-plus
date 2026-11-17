// panel.js
const requestList = document.getElementById('requests');
const responseBody = document.getElementById('response-body');

// Listen for every request that finishes loading
chrome.devtools.network.onRequestFinished.addListener((entry) => {
  const { request, response } = entry;

  // Create a list item for the request
  const listItem = document.createElement('li');
  listItem.textContent = `${request.method} ${request.url} (${response.status})`;

  // When the user clicks the item, fetch and show the response body
  listItem.addEventListener('click', () => {
    responseBody.textContent = 'Loading...';
    // This is the crucial step to get the body content
    entry.getContent((content, encoding) => {
      let text = content;
      // Responses can be base64 encoded; decode it to view text
      if (encoding === 'base64') {
        text = atob(content);
      }
      responseBody.textContent = text || '(No body content)';
    });
  });

  requestList.appendChild(listItem);
});