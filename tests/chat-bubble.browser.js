// Open the demo chat at a viewport at least 320px wide. Send
// "첫째 줄\n둘째 줄" and 500 consecutive W characters, then run this file
// with the browser tool's eval command.
(() => {
  const messageText = '첫째 줄\n둘째 줄';
  const textElements = Array.from(document.querySelectorAll('div')).filter((element) => (
    element.childElementCount === 0
    && element.getBoundingClientRect().width > 0
  ));
  const message = textElements.find((element) => element.textContent === messageText);

  if (!message) {
    throw new Error('Send the two-line demo message before checking its layout.');
  }

  const bounds = message.getBoundingClientRect();
  const lineHeight = Number.parseFloat(getComputedStyle(message).lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    throw new Error('The message line height could not be measured.');
  }
  const expectedLines = 2;
  const renderedLines = Math.round(bounds.height / lineHeight);

  if (Math.abs(bounds.height - lineHeight * expectedLines) > 1) {
    throw new Error(`Two-line message wraps into ${renderedLines} lines at ${innerWidth}px.`);
  }

  const longMessage = textElements.find((element) => element.textContent === 'W'.repeat(500));
  if (!longMessage) {
    throw new Error('Send 500 consecutive W characters before checking long-message layout.');
  }

  const bubbleBounds = longMessage.parentElement.getBoundingClientRect();
  if (bubbleBounds.left < 0 || bubbleBounds.right > innerWidth) {
    throw new Error(`Long-message bubble extends outside the ${innerWidth}px viewport.`);
  }

  if (document.documentElement.scrollWidth > innerWidth) {
    throw new Error('The chat overflows the viewport horizontally.');
  }

  return {
    viewportWidth: innerWidth,
    renderedLines,
    messageWidth: bounds.width,
    longMessageWidth: bubbleBounds.width,
  };
})();
