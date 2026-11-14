(async () => {
  // Run with browser eval after sending 500 consecutive 가
  // characters. Also run after another send, re-entry, or viewport height change.
  const list = Array.from(document.querySelectorAll('div')).find((element) => (
    getComputedStyle(element).overflowY === 'auto'
    && element.clientHeight > 0
    && element.innerText.includes('가'.repeat(500))
  ));

  if (!list) {
    throw new Error('Open a demo chat and send 500 consecutive 가 characters first.');
  }

  let measurement;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const lastMessage = Array.from(list.querySelectorAll('div')).filter((element) => (
      element.childElementCount === 0 && element.textContent.trim().length > 0
    )).at(-1);

    if (!lastMessage) {
      throw new Error('The latest rendered message could not be found.');
    }

    const listBounds = list.getBoundingClientRect();
    const messageBounds = lastMessage.getBoundingClientRect();
    const remaining = list.scrollHeight - list.scrollTop - list.clientHeight;
    measurement = {
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      remaining,
      latestMessageBottom: messageBounds.bottom,
      listBottom: listBounds.bottom,
    };

    if (remaining <= 2 && messageBounds.bottom <= listBounds.bottom + 1) {
      return measurement;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Latest message is not at the bottom: ${JSON.stringify(measurement)}`);
})();
