/* ---------------- DATE HELPERS ---------------- */

function getDateKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(getDateKey(new Date(current)));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/* ---------------- ALARM (EVERY MINUTE) ---------------- */

chrome.alarms.create("summaryCheck", {
  periodInMinutes: 1
});

/* ---------------- MAIN LOGIC ---------------- */

chrome.alarms.onAlarm.addListener(() => {
  const now = new Date();

  if (now.getHours() !== 23 || now.getMinutes() !== 59) return;

  sendDailySummary(now);

  // Weekly summary on Sunday
  if (now.getDay() === 0) {
    sendWeeklySummary(now);
  }

  // Monthly summary on last day
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (tomorrow.getDate() === 1) {
    sendMonthlySummary(now);
  }
});

/* ---------------- DAILY SUMMARY ---------------- */

function sendDailySummary(now) {
  const todayKey = getDateKey(now);

  chrome.storage.local.get([todayKey], res => {
    if (!res[todayKey]) return;
    showNotification(
      "Daily Shopping Summary",
      buildSummaryMessage(res[todayKey])
    );
  });
}

/* ---------------- WEEKLY SUMMARY ---------------- */

function sendWeeklySummary(now) {
  const monday = getMonday(now);
  const dates = getDateRange(monday, now);

  chrome.storage.local.get(dates, res => {
    const combined = combineData(res);
    if (!Object.keys(combined).length) return;

    showNotification(
      "Weekly Shopping Summary",
      buildSummaryMessage(combined)
    );
  });
}

/* ---------------- MONTHLY SUMMARY ---------------- */

function sendMonthlySummary(now) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const dates = getDateRange(start, now);

  chrome.storage.local.get(dates, res => {
    const combined = combineData(res);
    if (!Object.keys(combined).length) return;

    showNotification(
      "Monthly Shopping Summary",
      buildSummaryMessage(combined)
    );
  });
}

/* ---------------- DATA COMBINERS ---------------- */

function combineData(dataByDate) {
  const result = {};

  for (const day in dataByDate) {
    const sites = dataByDate[day];
    for (const site in sites) {
      if (!result[site]) result[site] = [];
      result[site].push(...sites[site]);
    }
  }

  return result;
}

/* ---------------- MESSAGE BUILDER ---------------- */

function buildSummaryMessage(data) {
  let total = 0;
  let message = "";

  for (const site in data) {
    const count = data[site].length;
    const sum = data[site].reduce((a, b) => a + b, 0);
    total += sum;

    message += `${site}\n• Products: ${count}\n• ₹${sum}\n\n`;
  }

  message += `TOTAL POTENTIAL SPEND: ₹${total}`;
  return message.slice(0, 3900);
}

/* ---------------- NOTIFICATION ---------------- */

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title,
    message
  });
}
